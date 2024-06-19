import { RunService } from "@rbxts/services";

const max = math.max;
export class Timer {
  static Create(callback: (timer: Timer, GetConnection: () => RBXScriptConnection | undefined) =>
    { wait_time?: number, one_shot?: boolean, autostart?: boolean, timeout_callback?: () => void }) {
    const timer = new Timer();
    let connection: RBXScriptConnection | undefined
    const { wait_time, one_shot, autostart, timeout_callback } = callback(timer, () => connection);
    if (wait_time !== undefined) timer.wait_time_ = wait_time;
    if (one_shot !== undefined) timer.one_shot_ = one_shot;
    if (timeout_callback) connection = timer.on_time_out_.Connect(timeout_callback);
    if (autostart) timer.Start();
    return $tuple(timer, connection);
  }

  public wait_time_ = 1;
  private time_left_ = 0;

  public one_shot_ = true;

  public paused_ = false;
  private stopped_ = true;

  private time_out_event_: BindableEvent = new Instance("BindableEvent");
  readonly on_time_out_: RBXScriptSignal = this.time_out_event_.Event;

  private update_connection_?: RBXScriptConnection

  Start(time_sec = -1) {
    if (time_sec > 0) {
      this.wait_time_ = time_sec;
    }
    //stops the existing timer
    this.Stop();

    this.time_left_ = this.wait_time_;
    //takes stopped flag away
    this.stopped_ = false;
    this.update_connection_ = RunService.Heartbeat.Connect(delta_time => this.Update(delta_time));
  }

  private Update(delta_time: number) {
    //dont update if paused
    if (this.paused_) return;

    this.time_left_ -= delta_time;
    if (this.time_left_ > 0) return

    this.time_out_event_.Fire();

    if (!this.one_shot_) {
      //restarts the time if not oneshot
      this.time_left_ = this.wait_time_;
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
    this.paused_ = false;
    this.stopped_ = true;
  }
  IsStopped() {
    return this.stopped_;
  }

  GetTimeLeft() {
    return this.time_left_;
  }

  Destroy() {
    this.Stop();
    this.time_out_event_.Destroy();
  }
}


