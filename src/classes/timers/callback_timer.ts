class Builder {
  /**@hidden */
  timer_: CallbackTimer = new CallbackTimer();
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
  WithTimeOutCallback(callback: () => void) {
    this.timer_.SetCallback(callback);
    return this;
  }
  WithYieldAfterCall(value: boolean) {
    this.timer_.yield_after_call = value;
    return this;
  }
  WithTerminateOld(value: boolean) {
    this.timer_.terminate_old = value;
    return this;
  }
  WithAutoStart() {
    this.auto_start_ = true;
    return this;
  }
  Build() {
    if (this.auto_start_) this.timer_.Start();
    return this.timer_;
  }
}

/**the constructor will be private
* @see https://discord.com/channels/476080952636997633/1253704157744074822
*/
export class CallbackTimer {
  static Builder = Builder;


  public wait_time = 1;
  /**dont restart the timer til the callback is finished. 
   * 
   *Applied only if one_shot is false
   */
  public yield_after_call = false;
  /**stops the previous callback if it's still running. 
   * 
   *Applied only if one_shot is false
  */
  public terminate_old = false;
  private start_time_ = 0;

  /**
   * if one_shot if true, the timer will work only once and will stop
   * if false timer works until the manual Stop()
   * default is true
   */
  public one_shot = true;

  private stopped_ = true;
  IsStopped() { return this.stopped_; }

  private thread_?: thread;
  private callback_thread_?: thread;
  private callback_: () => void = () => { };
  SetCallback(callback: () => void) {
    this.callback_ = callback;
    return this;
  }

  // private constructor() { };

  Start(time_sec = -1) {
    if (time_sec > 0) {
      this.wait_time = time_sec;
    }
    //stops the existing timer
    this.Stop();

    this.start_time_ = os.clock();
    //takes stopped flag away
    this.stopped_ = false;
    this.thread_ = task.spawn(() => this.Cycle());
  }

  private TerminateCallbackThread() {
    if (this.callback_thread_ === undefined) return;
    task.cancel(this.callback_thread_);
    this.callback_thread_ = undefined;
  }

  private Cycle() {
    while (task.wait(this.wait_time)) {
      if (this.terminate_old) this.TerminateCallbackThread();
      if (this.yield_after_call) this.callback_();
      else this.callback_thread_ = task.spawn(this.callback_);
      if (this.one_shot) break;
    }
    //cannot stop the thread from inside;
    this.stopped_ = true;
  }

  /**
   * way to stop the timer in timer callback
   * @param terminate_callback whether to stop running callback defaults to false
   * if called from the timer callback should be always false, its better to handle termination within the callback with return statement
   * 
   * ```ts
   * function TimerFunction()
   * ...
   *  if(something){
   *   timer.StopInThread();
   *   return;
   *  }
   * }
   * ```
   */
  StopInThread(terminate_callback: boolean = false) {
    this.stopped_ = true;
    if (terminate_callback) this.TerminateCallbackThread();
  }

  /**
   * should not be called from the callback in the timer, can cause error!
   * @param terminate_callback 
   */
  Stop(terminate_callback: boolean = false) {
    if (this.thread_ !== undefined) {
      task.cancel(this.thread_);
      this.thread_ = undefined;
    }
    if (terminate_callback) this.TerminateCallbackThread();

    this.stopped_ = true;
  }

  GetTimeLeft() {
    return math.max(
      this.wait_time - (os.clock() - this.start_time_)
      , 0);
  }

  Destroy() {
    this.Stop();
  }
}
