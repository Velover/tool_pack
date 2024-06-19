const clock = os.clock;
export class FlagTimer {
  public wait_time_ = 1;
  private time_left_ = 0;
  private current_time_ = 0;
  private stopped_ = true;

  Start(time_sec = -1) {
    if (time_sec > 0) {
      this.wait_time_ = time_sec;
    }
    this.time_left_ = this.wait_time_;
    this.current_time_ = os.clock();
    this.stopped_ = false;
  }

  Stop() {
    this.stopped_ = true;
  }

  IsStopped() {
    if (this.stopped_) return true;
    //recalculates stop;
    this.stopped_ = clock() - this.current_time_ >= this.time_left_;
    return this.stopped_;
  }
}