const clock = os.clock;

class Builder {
	static Create() {
		return new FlagTimer.Builder();
	}
	private timer_: FlagTimer = new FlagTimer();
	private auto_start_ = false;
	WithTimer(callback: (timer: FlagTimer) => void) {
		callback(this.timer_);
		return this;
	}
	WithWaitTime(value: number) {
		this.timer_.wait_time = value;
		return this;
	}
	WithAutoStart() {
		this.auto_start_ = true;
		return this;
	}
	Build(): FlagTimer {
		if (this.auto_start_) this.timer_.Start();
		return this.timer_;
	}
}

setmetatable(Builder, {
	__call: () => {
		return new Builder();
	},
});

type CallableBuilder = typeof Builder & { (): Builder };
export class FlagTimer {
	static Builder = Builder as CallableBuilder;

	public wait_time = 1;
	private time_left_ = 0;
	private current_time_ = 0;

	private stopped_ = true;
	IsStopped() {
		if (this.stopped_) return true;
		//recalculates stop;
		this.stopped_ = clock() - this.current_time_ >= this.time_left_;
		return this.stopped_;
	}

	// private constructor() {}
	Start(time_sec = -1) {
		if (time_sec > 0) {
			this.wait_time = time_sec;
		}
		this.time_left_ = this.wait_time;
		this.current_time_ = os.clock();
		this.stopped_ = false;
	}

	Stop() {
		this.stopped_ = true;
	}
}
