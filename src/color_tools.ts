//!native
//!optimize 2
import { MathTools } from "./math_tools";

//!optimize 2
export namespace ColorTools {
  const floor = math.floor
  /**packs color in binary form 32bit */
  export function PackColor(r: number, g: number, b: number, a: number) {
    return (r * 255) | ((g * 255) << 8) | ((b * 255) << 16) | ((a * 255) << 24);
  }

  /**packs color in binary form 32bit */

  export function PackColor3(color: Color3) {
    return PackColor(color.R, color.G, color.B, 1)
  }

  /**unpacks color from binary*/
  export function UnpackColor3(packed_color: number) {
    const [r, g, b, a] = UnpackColor(packed_color);
    return new Color3(r, g, b);
  }

  /**unpacks color from binary*/
  export function UnpackColor(packed_color: number) {
    const r = (packed_color & 0xff) / 255;
    const g = ((packed_color & 0xff00) >>> 8) / 255;
    const b = ((packed_color & 0xff0000) >>> 16) / 255;
    const a = ((packed_color & 0xff000000) >>> 24) / 255;
    return $tuple(r, g, b, a);
  }

  const min = math.min;
  const max = math.max;
  const pow = math.pow;
  const abs = math.abs;
  const sqrt = math.sqrt;
  const atan2 = math.atan2;
  const pi = math.pi;
  const angle_60 = pi / 3;
  const angle_120 = angle_60 * 2;
  const angle_240 = angle_120 * 2
  const angle_300 = angle_60 * 5;
  const tau = pi * 2;

  /**@link https://medium.muz.li/the-science-of-color-contrast-an-expert-designers-guide-33e84c41d156 */
  function ConvertValueToLinearColorSpace(value: number) {
    if (value <= 0.03928) return value / 12.92
    return pow((value + 0.055) / 1.055, 2.4);
  }
  function ConvertToLinearColorSpace(color: Color3) {
    let r = ConvertValueToLinearColorSpace(color.R);
    let g = ConvertValueToLinearColorSpace(color.G);
    let b = ConvertValueToLinearColorSpace(color.B);
    return $tuple(r, g, b);
  }
  export function GetRelativeLuminance(color: Color3) {
    let [r, g, b] = ConvertToLinearColorSpace(color);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  export function CalculateContrastRatio(color_1: Color3, color_2: Color3) {
    const luminance_1 = GetRelativeLuminance(color_1);
    const luminance_2 = GetRelativeLuminance(color_2);

    const max_luminance = max(luminance_1, luminance_2);
    const min_luminance = min(luminance_1, luminance_2);

    return (max_luminance + .05) / (min_luminance + .05)
  }

  const black = new Color3(0, 0, 0);
  const white = new Color3(1, 1, 1);

  /**
   * @returns if the colors luminance if greater than .6
   */
  export function IsBright(color: Color3) {
    return GetRelativeLuminance(color) >= .6;
  }

  /**
   * @returns black or white
   */
  export function GetSimpleContrastColor(color: Color3) {
    return IsBright(color) ? black : white
  }

  /**
   * @returns contrast rgb color
   */
  export function GetContrastColor(color: Color3) {
    const [r, g, b] = ConvertToLinearColorSpace(color);
    const luminance = GetRelativeLuminance(color);

    const saturation = (max(r, g, b) - min(r, g, b)) / max(r, g, b);
    const alpha = .5 * (2 * r - g - b);
    const beta = sqrt(3) * .5 * (g - b);
    const hue = atan2(beta, alpha);
    return Color3.fromHSV(hue, saturation, luminance);
  }

  /**
   * @link https://www.rapidtables.com/convert/color/rgb-to-hsv.html
   *  
   * */
  export function RGBToHSV(r: number, g: number, b: number) {
    const max_value = max(r, g, b);
    const min_value = min(r, g, b);

    let hue = -1;
    let saturation = -1;
    const difference = max_value - min_value;
    //can be bigger than tau, so clamp
    if (difference === 0) {
      hue = 0;
    } else if (max_value === r) {
      hue = angle_60 * ((g - b) / difference % 6) % tau;
    } else if (max_value === g) {
      hue = angle_60 * ((b - r) / difference + 2) % tau;
    } else if (max_value === b) {
      hue = angle_60 * ((r - g) / difference + 4) % tau;
    }

    if (max_value === 0) {
      saturation = 0;
    } else {
      saturation = difference / max_value
    };

    const value = max_value;
    //maps the hue from angle to value [0 - 1];
    hue = MathTools.Map(hue, 0, tau, 0, 1, false);
    return $tuple(hue, saturation, value);
  }

  /**
   * @link https://www.rapidtables.com/convert/color/hsv-to-rgb.html
   *  
   * */
  export function HSVToRGB(h: number, s: number, v: number) {
    //maps hue from [0 - 1] to angle
    h = MathTools.Map(h, 0, 1, 0, tau)
    const c = v * s;
    const x = c * (1 - abs(h / angle_60) % 2 - 1);
    const m = v - c;
    let r = 0;
    let g = 0;
    let b = 0;

    if (h < angle_60) {
      r = c;
      g = x;
    } else if (h < angle_120) {
      r = x;
      g = c;
    } else if (h < pi) {
      g = c;
      b = x;
    } else if (h < angle_240) {
      g = x;
      b = c;
    } else if (h < angle_300) {
      r = c;
      b = x;
    } else {
      r = c;
      b = x;
    }

    r += m;
    g += m;
    b += m;

    return $tuple(r, g, b);
  }


  /**
  * @see https://github.com/littensy/rbxts-react-example/blob/main/src/client/utils/color-utils.ts
  * @param color The color to brighten or darken
  * @param brightness The amount to brighten or darken the color
  * @param vibrancy How much saturation changes with brightness
  */
  export function Brighten(color: Color3, brightness: number, vibrancy = 0.5) {
    const [h, s, v] = color.ToHSV();
    return Color3.fromHSV(h, math.clamp(s - brightness * vibrancy, 0, 1), math.clamp(v + brightness, 0, 1));
  }

  /**
   * @see https://github.com/littensy/rbxts-react-example/blob/main/src/client/utils/color-utils.ts
   * @param color The color to saturate or desaturate
   * @param saturation How much to add or remove from the color's saturation
   */
  export function Saturate(color: Color3, saturation: number) {
    const [h, s, v] = color.ToHSV();
    return Color3.fromHSV(h, math.clamp(s + saturation, 0, 1), v);
  }
}