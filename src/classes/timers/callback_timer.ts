export class CallbackTimer {
  static Create(callback: (timer: CallbackTimer) =>
    Partial<{
      wait_time: number,
      one_shot: boolean,
      autostart: boolean,
      timeout_callback: () => void,
      yield_after_call: boolean,
      terminate_old: boolean
    }>) {
    const timer = new CallbackTimer();
    const { wait_time, one_shot, autostart, timeout_callback, yield_after_call, terminate_old } = callback(timer);
    if (wait_time !== undefined) timer.wait_time_ = wait_time;
    if (one_shot !== undefined) timer.one_shot_ = one_shot;
    if (timeout_callback !== undefined) timer.SetCallback(timeout_callback);
    if (yield_after_call !== undefined) timer.yield_after_call_ = yield_after_call;
    if (terminate_old !== undefined) timer.terminate_old_ = terminate_old;
    if (autostart) timer.Start();

    return timer;
  }
  public wait_time_ = 1;
  /**dont restart the timer til the callback is finished. 
   * 
   *Applied only if one_shot is false
   */
  public yield_after_call_ = false;
  /**stops the previous callback if it's still running. 
   * 
   *Applied only if one_shot is false
  */
  public terminate_old_ = false;
  private start_time_ = 0;

  public one_shot_ = true;

  private stopped_ = true;

  private thread_?: thread;
  private callback_thread_?: thread;
  private callback_: () => void = () => { };

  Start(time_sec = -1) {
    if (time_sec > 0) {
      this.wait_time_ = time_sec;
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
    while (task.wait(this.wait_time_)) {
      if (this.terminate_old_) this.TerminateCallbackThread();
      if (this.yield_after_call_) this.callback_();
      else this.callback_thread_ = task.spawn(this.callback_);
      if (this.one_shot_) break;
    }
    //cannot stop the thread from inside;
    this.stopped_ = true;
  }

  StopInThread(terminate_callback: boolean = false) {
    this.stopped_ = true;
    if (terminate_callback) this.TerminateCallbackThread();
  }

  Stop(terminate_callback: boolean = false) {
    if (this.thread_ !== undefined) {
      task.cancel(this.thread_);
      this.thread_ = undefined;
    }
    if (terminate_callback) this.TerminateCallbackThread();

    this.stopped_ = true;
  }

  SetCallback(callback: () => void) {
    this.callback_ = callback;
  }

  IsStopped() {
    return this.stopped_;
  }

  GetTimeLeft() {
    return math.max(
      this.wait_time_ - (os.clock() - this.start_time_)
      , 0);
  }

  Destroy() {
    this.Stop();
  }
}
