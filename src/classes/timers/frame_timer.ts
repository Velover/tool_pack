import { RunService } from "@rbxts/services";
import { TweenTools } from "../../tween_tools";

type FrameTimerCallback = (time_passed: number, delta_time: number) => void
export class FrameTimer {
  /**
   * @param GetConnection will return the connection, but ONLY USE IN update_callback or timeout_callback
   */
  static Create(
    callback: (timer: FrameTimer, GetConnection: () => RBXScriptConnection | undefined) =>
      { wait_time?: number, one_shot?: boolean, autostart?: boolean, update_callback?: FrameTimerCallback, timeout_callback?: () => void }
  ) {
    const timer = new FrameTimer();
    let connection: RBXScriptConnection | undefined
    const { wait_time, one_shot, autostart, update_callback, timeout_callback } = callback(timer, () => connection);
    if (wait_time !== undefined) timer.wait_time = wait_time;
    if (one_shot !== undefined) timer.one_shot = one_shot;
    if (update_callback) timer.SetCallback(update_callback);
    if (timeout_callback) connection = timer.on_time_out.Connect(timeout_callback);
    if (autostart) timer.Start();
    return $tuple(timer, connection);
  }

  static CreateFast(
    callback: (timer: FrameTimer) =>
      { wait_time: number, update_callback: FrameTimerCallback, yields?: boolean, destroy_after_ended?: boolean }
  ) {
    const timer = new FrameTimer();
    const { wait_time, update_callback, yields, destroy_after_ended = true } = callback(timer);
    timer.SetCallback(update_callback);
    if (destroy_after_ended) timer.on_time_out.Once(() => timer.Destroy());
    timer.wait_time = wait_time;
    timer.Start();
    if (yields ?? true) task.wait(wait_time);
    if (!destroy_after_ended) return timer;
  }

  static CreateTween<T extends Tweenable>(
    start_value: T, target_value: T, wait_time: number, set_function: (new_value: T) => void,
    auto_start: boolean = true,
    easing_style?: Enum.EasingStyle, easing_direction?: Enum.EasingDirection
  ) {
    //TODO use Create Custom Tween
    const timer = new FrameTimer();
    timer.one_shot = true;
    timer.wait_time = wait_time;
    timer.SetCallback((time_passed) => {
      const alpha = time_passed / wait_time;
      const new_value = TweenTools.TweenValue(start_value, target_value, alpha, easing_style, easing_direction);
      set_function(new_value);
    })
    if (auto_start) timer.Start();
    return timer;
  }

  static CreateCustomTween<T extends Tweenable>(
    start_value: T, target_value: T, wait_time: number,
    create_tweener: () => (alpha: number, delta_time: number, time_passed: number, wait_time: number) => number,
    set_function: (new_value: T) => void,
    auto_start: boolean = true
  ) {
    const timer = new FrameTimer();
    timer.wait_time = wait_time;
    const tweener = create_tweener();
    timer.SetCallback((time_passed, delta_time) => {
      const alpha = time_passed / wait_time;
      const new_alpha = tweener(alpha, delta_time, time_passed, wait_time);
      const new_value = TweenTools.LerpValue(start_value, target_value, new_alpha)
      set_function(new_value);
    })
    if (auto_start) timer.Start();
    return timer;
  }

  public wait_time = 1;
  private time_left_ = 0;
  GetTimeLeft() { return this.time_left_; }

  private initialized_wait_time_ = 0;

  /**
   * if one_shot if true, the timer will work only once and will stop
   * if false timer works until the manual Stop()
   * * default is true
   */
  public one_shot = true;

  public paused = false;
  private stopped_ = true;
  IsStopped() {
    return this.stopped_;
  }

  private time_out_event_: BindableEvent = new Instance("BindableEvent");
  readonly on_time_out: RBXScriptSignal = this.time_out_event_.Event;

  private update_connection_?: RBXScriptConnection

  private callback_: FrameTimerCallback = () => { }
  private stepping_event_: RBXScriptSignal<(delta_time: number) => void> = RunService.Heartbeat;
  SetSteppingEvent(stepping_event: RBXScriptSignal<(delta_time: number) => void>) {
    this.stepping_event_ = stepping_event;
    return this;
  }

  /**
   * @param time_passed time passed since the start of the timer
   * @param callback callback that will be executed each frame
   */
  SetCallback(callback: FrameTimerCallback) {
    this.callback_ = callback;
    return this;
  }

  Start(time_sec = -1) {
    if (time_sec > 0) {
      this.wait_time = time_sec;
    }
    //stops the existing timer
    this.Stop();

    this.time_left_ = this.wait_time;
    //saves the time to calculate time passed
    this.initialized_wait_time_ = this.wait_time;

    //takes stopped flag away
    this.stopped_ = false;
    this.update_connection_ = this.stepping_event_.Connect(delta_time => this.Update(delta_time));

    return this;
  }

  /**
   * yields the thread til the timer has finished
   * @param ignore_if_stopped if false, yields til the timer will fire on_time_out even if stopped, defaults to true
   * 
   */
  Await(ignore_if_stopped: boolean = true) {
    if (ignore_if_stopped && this.stopped_) return this;
    this.on_time_out.Wait();
    return this;
  }

  private Update(delta_time: number) {
    //dont update if paused
    if (this.paused) return;

    this.time_left_ -= delta_time;
    //clamps to wait time
    const time_passed = math.min(this.initialized_wait_time_ - this.time_left_, this.wait_time);
    this.callback_(time_passed, delta_time);
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

    return this;
  }

  Destroy() {
    this.Stop();
    this.time_out_event_.Destroy();
  }
}