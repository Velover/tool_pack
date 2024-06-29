//!native
//!optimize 2
export namespace MathTools {
  const max = math.max;
  const min = math.min;
  const sign = math.sign;
  const abs = math.abs;
  const ceil = math.ceil;
  const pow = math.pow;
  const pi = math.pi;
  const tau = 2 * math.pi;
  /**
   * @param n 
   * @returns n!
   */
  export function Factor(n: number) {
    n = math.floor(n);
    if (n === 0 || n === 1) return 1;
    let result = n
    while (n > 1) {
      result *= --n
    }
    return result;
  }
  export function Lerp(start: number, target: number, alpha: number) {
    return start + (target - start) * alpha;
  }

  /**
   * goes in the direction of the target with step, will never overshoot the target
   * 
   * ```e.g start = 5, target = 6, step = 2    direction = 6 - 5 = 1    returns 5 + math.min(1, 2) = 6```
   * 
   * ```e.g start = 6, target = 4, step = 1    direction = 4 - 6 = -2    returns 6 - math.min(math.abs(-2), 1) = 5```
   * 
   * sugar for linear spring  
   * ```ts
   * current = LerpWith(current, target, speed * dt)
   * ```
   * 
   * @param start 
   * @param target 
   * @param step 
   * @returns 
   */
  export function LerpWith(start: number, target: number, step: number) {
    const difference = target - start;
    //calculating min difference towards target;
    step = sign(difference) * min(step, abs(difference));
    return start + step;
  }

  /**wraps angle to range [-pi, pi)
   * @see https://stackoverflow.com/questions/2320986/easy-way-to-keeping-angles-between-179-and-180-degrees
  */
  export function NormalizeAngle(alpha: number) {
    return alpha - (math.floor((alpha + math.pi) / tau)) * tau;
  }

  /**@see https://stackoverflow.com/questions/1878907/how-can-i-find-the-smallest-difference-between-two-angles-around-a-point */
  export function GetShortestAngle(start: number, target: number) {
    if (start === target) return 0;
    const difference = target - start;
    return (difference + math.pi) % tau - math.pi;
  }

  /**lerpes the angle with fixed step
   * angle [-pi, pi]
  */
  export function LerpAngleWith(start: number, target: number, step: number) {
    if (start === target) return NormalizeAngle(target);
    let angle = GetShortestAngle(start, target);

    //calculates minimal step to not overwalk the angle
    step = min(step, abs(angle));
    //step * sign(angle) -- steps in direction of the target angle
    const new_angle = start + step * sign(angle);
    //returns normalized angle
    return NormalizeAngle(new_angle);
  }

  /**maps the value from 1 range to other*/
  export function Map(value: number, input_min: number, input_max: number, output_min: number, output_max: number, clamp?: boolean) {
    const difference_input = input_max - input_min;
    const difference_output = output_max - output_min;
    const multiplier = difference_output / difference_input;

    const current_difference = value - input_min;
    let output = output_min + current_difference * multiplier;
    if (clamp) {
      const min_output = min(output_min, output_max);
      const max_output = max(output_min, output_max);
      //can be error if use clamp
      output = max(output, min_output);
      output = min(output, max_output);
    }
    return output
  }

  /**wraps number in range 
   * 2, 2, 0, 2 => 2
   * 0, 4, 0, 3 => 1
   * 0 + 4 = 4 - (3 - 0) => 1 
  */
  export function WrapAdd(value: number, step: number, min_value: number, max_value: number) {
    let offset_to_min_value = (value + step) - min_value;

    const range = max_value - min_value;
    //prevent cases with min and max values 0;
    if (range === 0) return min_value;

    //turns -1 to 0 without abs
    const range_ratio = ceil(abs(offset_to_min_value / range));
    if (offset_to_min_value > range) {
      //it should be in range of a range, or will subtract 2 ranges
      offset_to_min_value -= range * (range_ratio - 1);
    } else if (offset_to_min_value < 0) {
      offset_to_min_value += range * range_ratio;
    }
    return min_value + offset_to_min_value;
  }

  // export function WrapPage(page_number: number, min_page: number, max_page: number) {

  // }

  /**
   * 
   * unit number [0, 1]
   * bias [-inf, 1];
   * bias -1 -larger numbers are very frequent
   * bias 1 -smaller numbers are very frequent
   * bias power of the curve
   * gets bigger numbers that are less frequent
  *@see https://www.youtube.com/watch?v=lctXaT9pxA0&t=454s&ab_channel=SebastianLague
     */

  export function BiasFunction(unit_number: number, bias: number) {
    //pow works better than ^
    const k = pow(1 - bias, 3);
    return (unit_number * k) / (unit_number * k - unit_number + 1);
  }

  export function GetValueFromNumberSequence(number_sequence: NumberSequence, alpha: number) {
    const keypoints = number_sequence.Keypoints;
    //return first if alpha is 0
    if (alpha === 0) return keypoints[0].Value;
    //return last if alpha is 1
    if (alpha === 1) return keypoints[keypoints.size() - 1];

    let current_keypoint;
    let next_keypoint;
    let value = 0;
    for (const _ of $range(0, keypoints.size() - 2)) {
      current_keypoint = keypoints[0];
      next_keypoint = keypoints[1];
      if (!(alpha >= current_keypoint.Time && alpha <= next_keypoint.Time)) continue;

      /**time from the current keypoint */
      const offset = alpha - current_keypoint.Time;
      /**time range between the keypoints */
      const time_range = next_keypoint.Time - current_keypoint.Time;
      /**value range between the keypoints */
      const value_range = next_keypoint.Value - current_keypoint.Value;
      /**calculates the value, remaps offset from keypoint from time range to value range */
      value = offset / time_range * value_range;
      break;
    }

    return value;
  }
}
