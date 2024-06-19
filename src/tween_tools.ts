//!native
import { TweenService } from "@rbxts/services";
import { MathTools } from "./math_tools";
import { StringTools } from "./string_tools";

export namespace TweenTools {
  export function CreateTween<T extends Instance>(
    instance: T, tween_info: TweenInfo, properties: Partial<ExtractMembers<T, Tweenable>>, play: boolean = true, await: boolean = true) {
    const tween = TweenService.Create(instance, tween_info, properties);
    if (play) {
      tween.Play();
      if (await) tween.Completed.Wait();
    }

    return tween;
  }
  const Lerp = MathTools.Lerp;
  export type CustomTweenable = Tweenable | string
  export function LerpValue<T extends CustomTweenable>(start_value: T, target_value: T, alpha: number): T {
    const value_type = typeOf(start_value) as keyof CustomTweenable;
    if (value_type === "number") {
      return Lerp(<number>start_value, <number>target_value, alpha) as T;

    }
    else if (value_type === "string") {
      return StringTools.LerpTextTo(<string>start_value, <string>target_value, alpha) as T;
    }
    else if (value_type === "CFrame") {
      return (<CFrame>start_value).Lerp(<CFrame>target_value, alpha) as T;
    }
    else if (value_type === "Vector3") {
      const value_0 = <Vector3>start_value;
      const value_1 = <Vector3>target_value;
      return value_0.Lerp(value_1, alpha) as T;
    }
    else if (value_type === "Vector2") {
      return (<Vector2>start_value).Lerp(<Vector2>target_value, alpha) as T;
    }
    else if (value_type === "Color3") {
      return (<Color3>start_value).Lerp(<Color3>target_value, alpha) as T;
    }
    else if (value_type === "UDim2") {
      const value_0 = <UDim2>start_value;
      const value_1 = <UDim2>target_value;
      return value_0.Lerp(value_1, alpha) as T;
    }
    else if (value_type === "UDim") {
      const value_0 = <UDim>start_value;
      const value_1 = <UDim>target_value;
      return new UDim(Lerp(value_0.Scale, value_1.Scale, alpha), Lerp(value_0.Offset, value_1.Offset, alpha)) as T;
    }
    else if (value_type === "Rect") {
      const value_0 = <Rect>start_value;
      const value_1 = <Rect>target_value;
      return new Rect(value_0.Min.Lerp(value_1.Min, alpha), value_0.Max.Lerp(value_1.Max, alpha)) as T;

    }
    else if (value_type === "boolean") {
      return (alpha >= .5 ? true : false) as T;
    }

    const value_0 = <Vector2int16>start_value;
    const value_1 = <Vector2int16>target_value;
    const direction = value_1.sub(value_0);
    return value_0.add(new Vector2int16(direction.X * alpha, direction.Y * alpha)) as T;
  }

  export function TweenValue<T extends CustomTweenable>(start_value: T, target_value: T, alpha: number,
    easing_style: CastsToEnum<Enum.EasingStyle> = Enum.EasingStyle.Sine,
    easing_direction: CastsToEnum<Enum.EasingDirection> = Enum.EasingDirection.In
  ): T {
    const new_alpha = TweenService.GetValue(alpha, easing_style, easing_direction);
    return LerpValue(start_value, target_value, new_alpha) as T;
  }
}