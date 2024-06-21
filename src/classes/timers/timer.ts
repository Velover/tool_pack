import { RunService } from "@rbxts/services";

class Builder {
  //shortcut
  static Create() {
    return new Timer.Builder();
  }

  /**@hidden */
  timer_: Timer = new Timer();
  /**@hidden */
  auto_start_ = false;
  WithWaitTime(value: number) {
    this.timer_.wait_time = value;
    return this;
  }
  WithOneShot(value: boolean) {
    this.timer_.one_shot = value;
    return this;
  }
  WithTimeOutCallback(callback: (connection?: RBXScriptConnection) => void, with_connection?: (connection: RBXScriptConnection) => void) {
    const connection = this.timer_.on_time_out.Connect(() => callback(connection));
    with_connection?.(connection)
    return this;
  }
  WithAutoStart() {
    this.auto_start_ = true;
    return this
  }
  Build() {
    if (this.auto_start_) this.timer_.Start();
    return this.timer_;
  }
};

/**the constructor will be private
* @see https://discord.com/channels/476080952636997633/1253704157744074822
*/
export class Timer {
  static Builder = Builder;


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

  // private constructor() { }

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
    this.time_left_ = math.max(this.time_left_, 0);
    this.update_connection_?.Disconnect();
    this.paused = false;
    this.stopped_ = true;
  }

  Destroy() {
    this.Stop();
    this.time_out_event_.Destroy();
  }
}


