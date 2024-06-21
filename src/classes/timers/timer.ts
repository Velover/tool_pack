import { RunService } from "@rbxts/services";

const max = math.max;
export class Timer {
  static Create(callback: (timer: Timer, GetConnection: () => RBXScriptConnection | undefined) =>
    { wait_time?: number, one_shot?: boolean, autostart?: boolean, timeout_callback?: () => void }) {
    const timer = new Timer();
    let connection: RBXScriptConnection | undefined
    const { wait_time, one_shot, autostart, timeout_callback } = callback(timer, () => connection);
    if (wait_time !== undefined) timer.wait_time = wait_time;
    if (one_shot !== undefined) timer.one_shot = one_shot;
    if (timeout_callback) connection = timer.on_time_out.Connect(timeout_callback);
    if (autostart) timer.Start();
    return $tuple(timer, connection);
  }

  public wait_time = 1;
  private time_left_ = 0;
  GetTimeLeft() { return this.time_left_; }

  /**
   * if one_shot if true, the timer will work only once and will stop
   * if false timer works until the manual Stop()
   * * default is true
   */
  public one_shot = true;

  public paused = false;
  private stopped_ = true;
  IsStopped() { return this.stopped_; }

  private time_out_event_: BindableEvent = new Instance("BindableEvent");
  readonly on_time_out: RBXScriptSignal = this.time_out_event_.Event;

  private update_connection_?: RBXScriptConnection

  Start(time_sec = -1) {
    if (time_sec > 0) {
      this.wait_time = time_sec;
    }
    //stops the existing timer
    this.Stop();

    this.time_left_ = this.wait_time;
    //takes stopped flag away
    this.stopped_ = false;
    this.update_connection_ = RunService.Heartbeat.Connect(delta_time => this.Update(delta_time));
  }

  private Update(delta_time: number) {
    //dont update if paused
    if (this.paused) return;

    this.time_left_ -= delta_time;
    if (this.time_left_ > 0) return

    this.time_out_event_.Fire();

    if (!this.one_shot) {
      //restarts the time if not oneshot
      this.time_left_ = this.wait_time;
      return;
    }

    //stops if one shot
    this.Stop();
  }

  Stop() {
    if (this.stopped_) return;

    //clamps the time
    this.time_left_ = max(this.time_left_, 0);
    this.update_connection_?.Disconnect();
    this.paused = false;
    this.stopped_ = true;
  }

  Destroy() {
    this.Stop();
    this.time_out_event_.Destroy();
  }
}


