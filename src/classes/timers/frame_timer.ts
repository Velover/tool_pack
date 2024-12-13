import { RunService, TweenService } from "@rbxts/services";
import { TweenTools } from "../../tween_tools";

type FrameTimerCallback = (time_passed: number, delta_time: number) => void;
type SteppingEvent = RBXScriptSignal<(delta_time: number) => void>;

class Builder {
	static Create() {
		return new FrameTimer.Builder();
	}

	private timer_: FrameTimer = new FrameTimer();
	private auto_start_ = false;
	WithTimer(callback: (timer: FrameTimer) => void) {
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
	WithUpdateCallback(callback: FrameTimerCallback) {
		this.timer_.SetUpdateCallback(callback);
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
	WithSteppingMethod(stepping_event: SteppingEvent) {
		this.timer_.SetSteppingEvent(stepping_event);
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
export class FrameTimer {
	static Builder = Builder as CallableBuilder;

	static CreateCustomTweenTemplate<T extends TweenTools.CustomTweenable>(
		start_value: T,
		target_value: T,
		wait_time: number,
		create_new_alpha_generator: () => (
			alpha: number,
			delta_time: number,
			time_passed: number,
			wait_time: number,
		) => number,
		auto_start?: boolean,
	) {
		return (callback: (value: T) => void) => {
			return this.CreateCustomTween(
				start_value,
				target_value,
				wait_time,
				create_new_alpha_generator,
				callback,
				auto_start,
			);
		};
	}

	static CreateTweenTemplate<T extends TweenTools.CustomTweenable>(
		start_value: T,
		target_value: T,
		wait_time: number,
		auto_start?: boolean,
		easing_style?: Enum.EasingStyle,
		easing_direction?: Enum.EasingDirection,
	) {
		return (callback: (value: T) => void) => {
			return this.CreateTween(
				start_value,
				target_value,
				wait_time,
				callback,
				auto_start,
				easing_style,
				easing_direction,
			);
		};
	}

	static CreateTween<T extends TweenTools.CustomTweenable>(
		start_value: T,
		target_value: T,
		wait_time: number,
		set_function: (new_value: T) => void,
		auto_start: boolean = false,
		easing_style: Enum.EasingStyle = Enum.EasingStyle.Cubic,
		easing_direction: Enum.EasingDirection = Enum.EasingDirection.InOut,
	) {
		return FrameTimer.CreateCustomTween(
			start_value,
			target_value,
			wait_time,
			() => {
				return (alpha) =>
					TweenService.GetValue(alpha, easing_style, easing_direction);
			},
			set_function,
			auto_start,
		);
	}

	/**
	 *
	 * @param start_value
	 * @param target_value
	 * @param wait_time
	 * @param create_new_alpha_generator creates a callback that will provide new alpha from existing like TweenService.GetValue
	 * @param set_function
	 * @param auto_start
	 * @returns
	 */
	static CreateCustomTween<T extends TweenTools.CustomTweenable>(
		start_value: T,
		target_value: T,
		wait_time: number,
		create_new_alpha_generator: () => (
			alpha: number,
			delta_time: number,
			time_passed: number,
			wait_time: number,
		) => number,
		set_function: (new_value: T) => void,
		auto_start: boolean = true,
	) {
		const timer = new FrameTimer();
		timer.WaitTime = wait_time;
		const alpha_generator = create_new_alpha_generator();
		timer.SetUpdateCallback((time_passed, delta_time) => {
			const alpha = time_passed / wait_time;
			const new_alpha = alpha_generator(
				alpha,
				delta_time,
				time_passed,
				wait_time,
			);
			const new_value = TweenTools.LerpValue(
				start_value,
				target_value,
				new_alpha,
			);
			set_function(new_value);
		});
		if (auto_start) timer.Start();
		return timer;
	}

	public WaitTime = 1;
	private time_left_ = 0;
	GetTimeLeft() {
		return this.time_left_;
	}

	private initialized_wait_time_ = 0;

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

	private update_callback_: FrameTimerCallback = () => {};
	/**
	 * @param time_passed time passed since the start of the timer
	 * @param callback callback that will be executed each frame
	 */
	SetUpdateCallback(callback: FrameTimerCallback) {
		this.update_callback_ = callback;
		return this;
	}

	/**
	 * update event, defaults to RunService.Heartbeat
	 */
	private stepping_event_: SteppingEvent = RunService.Heartbeat;
	SetSteppingEvent(stepping_event: SteppingEvent) {
		this.stepping_event_ = stepping_event;
		return this;
	}

	// private constructor() {}

	Start(time_sec = -1) {
		if (time_sec > 0) {
			this.WaitTime = time_sec;
		}
		//stops the existing timer
		this.Stop();

		this.time_left_ = this.WaitTime;
		//saves the time to calculate time passed
		this.initialized_wait_time_ = this.WaitTime;

		//takes stopped flag away
		this.stopped_ = false;
		this.update_connection_ = this.stepping_event_.Connect((delta_time) =>
			this.Update(delta_time),
		);

		return this;
	}

	/**
	 * yields the thread til the timer has finished
	 * @param ignore_if_stopped if false, yields til the timer will fire on_time_out even if stopped, defaults to true
	 */
	Await(ignore_if_stopped: boolean = true) {
		if (ignore_if_stopped && this.stopped_) return this;
		this.OnTimeOut.Wait();
		return this;
	}

	private Update(delta_time: number) {
		//dont update if paused
		if (this.Paused) return;

		this.time_left_ -= delta_time;
		//clamps to wait time
		const time_passed = math.min(
			this.initialized_wait_time_ - this.time_left_,
			this.WaitTime,
		);
		this.update_callback_(time_passed, delta_time);
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

		return this;
	}

	Destroy() {
		this.Stop();
		this.time_out_event_.Destroy();
	}
}
