import { RunService } from "@rbxts/services";

class Builder {
	//shortcut
	static Create() {
		return new Timer.Builder();
	}

	private timer_: Timer = new Timer();
	private auto_start_ = false;
	WithTimer(callback: (timer: Timer) => void) {
		callback(this.timer_);
		return this;
	}
	WithWaitTime(value: number) {
		this.timer_.WaitTime = value;
		return this;
	}
	WithOneShot(value: boolean) {
		this.timer_.OneShot = value;
		return this;
	}
	WithTimeOutCallback(
		callback: (connection?: RBXScriptConnection) => void,
		with_connection?: (connection: RBXScriptConnection) => void,
	) {
		const connection = this.timer_.OnTimeOut.Connect(() =>
			callback(connection),
		);
		with_connection?.(connection);
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

setmetatable(Builder, {
	__call: () => {
		return new Builder();
	},
});

type CallableBuilder = typeof Builder & { (): Builder };
export class Timer {
	static Builder = Builder as CallableBuilder;
	public WaitTime = 1;
	private time_left_ = 0;
	GetTimeLeft() {
		return this.time_left_;
	}

	/**
	 * if one_shot if true, the timer will work only once and will stop
	 * if false timer works until the manual Stop()
	 * * default is true
	 */
	public OneShot = true;

	public Paused = false;
	private stopped_ = true;
	IsStopped() {
		return this.stopped_;
	}

	private time_out_event_: BindableEvent = new Instance("BindableEvent");
	readonly OnTimeOut: RBXScriptSignal = this.time_out_event_.Event;

	private update_connection_?: RBXScriptConnection;

	// private constructor() {}

	Start(time_sec = -1) {
		if (time_sec > 0) {
			this.WaitTime = time_sec;
		}
		//stops the existing timer
		this.Stop();

		this.time_left_ = this.WaitTime;
		//takes stopped flag away
		this.stopped_ = false;
		this.update_connection_ = RunService.Heartbeat.Connect((delta_time) =>
			this.Update(delta_time),
		);
	}

	private Update(delta_time: number) {
		//dont update if paused
		if (this.Paused) return;

		this.time_left_ -= delta_time;
		if (this.time_left_ > 0) return;

		this.time_out_event_.Fire();

		if (!this.OneShot) {
			//restarts the time if not oneshot
			this.time_left_ = this.WaitTime;
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
		this.Paused = false;
		this.stopped_ = true;
	}

	Destroy() {
		this.Stop();
		this.time_out_event_.Destroy();
	}
}
