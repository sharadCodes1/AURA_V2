// Continuous voice-activity detection for hands-free conversation.
//
// Keeps the mic open and watches the input level. When you start speaking it records
// an utterance; when you pause it finalizes that utterance and hands the audio to
// `onUtterance`. It pauses capture while AURA is speaking (via shouldPause()) so it
// never transcribes its own voice. Loops until stop() is called.

export type ConvState = "idle" | "listening" | "capturing" | "speaking";

interface Options {
  onUtterance: (audio: Blob) => void;
  onState?: (state: ConvState) => void;
  onLevel?: (level: number) => void; // 0..1, for the meter
  shouldPause?: () => boolean; // return true while TTS is speaking
}

// Tuning
const START_LEVEL = 0.06; // RMS to consider "speech started"
const STOP_LEVEL = 0.04; // below this counts toward silence
const SILENCE_MS = 900; // trailing silence that ends an utterance
const MIN_UTTERANCE_MS = 350; // ignore blips
const MAX_UTTERANCE_MS = 12000; // hard cap

export class ConversationController {
  private opts: Options;
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private raf: number | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private capturing = false;
  private speechStartedAt = 0;
  private lastLoudAt = 0;
  private running = false;

  constructor(opts: Options) {
    this.opts = opts;
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    this.ctx = new AudioContext();
    const source = this.ctx.createMediaStreamSource(this.stream);
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    this.running = true;
    this.setState("listening");

    const loop = () => {
      if (!this.running) return;
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      this.opts.onLevel?.(Math.min(1, rms * 3));

      const paused = this.opts.shouldPause?.() ?? false;
      const now = performance.now();

      if (paused) {
        // AURA is talking — don't capture; drop any in-progress capture.
        if (this.capturing) this.abortCapture();
        this.setState("speaking");
      } else if (!this.capturing) {
        this.setState("listening");
        if (rms > START_LEVEL) this.beginCapture(now);
      } else {
        // capturing
        if (rms > STOP_LEVEL) this.lastLoudAt = now;
        const silentFor = now - this.lastLoudAt;
        const totalFor = now - this.speechStartedAt;
        if (silentFor > SILENCE_MS || totalFor > MAX_UTTERANCE_MS) {
          this.endCapture(totalFor);
        }
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private beginCapture(now: number) {
    if (!this.stream) return;
    this.chunks = [];
    const recorder = new MediaRecorder(this.stream);
    recorder.ondataavailable = (e) => e.data.size > 0 && this.chunks.push(e.data);
    recorder.onstop = () => {
      const total = performance.now() - this.speechStartedAt;
      if (total >= MIN_UTTERANCE_MS && this.chunks.length) {
        this.opts.onUtterance(new Blob(this.chunks, { type: recorder.mimeType || "audio/mp4" }));
      }
    };
    recorder.start();
    this.recorder = recorder;
    this.capturing = true;
    this.speechStartedAt = now;
    this.lastLoudAt = now;
    this.setState("capturing");
  }

  private endCapture(_total: number) {
    this.capturing = false;
    this.recorder?.stop();
    this.recorder = null;
    this.setState("listening");
  }

  private abortCapture() {
    this.capturing = false;
    if (this.recorder) {
      this.recorder.ondataavailable = null;
      this.recorder.onstop = null;
      try {
        this.recorder.stop();
      } catch {
        /* noop */
      }
      this.recorder = null;
    }
    this.chunks = [];
  }

  private setState(s: ConvState) {
    this.opts.onState?.(s);
  }

  stop(): void {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.abortCapture();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.opts.onLevel?.(0);
    this.setState("idle");
  }
}
