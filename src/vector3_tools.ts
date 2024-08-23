//!native
//!optimize 2

import { ArrayTools } from "./array_tools";

export namespace Vector3Tools {
	const clamp = math.clamp;
	const min = math.min;

	/**
	 * clamps the vector between the numbers
	 */
	export function Clamp(vector: Vector3, min: number, max: number) {
		return new Vector3(
			clamp(vector.X, min, max),
			clamp(vector.Y, min, max),
			clamp(vector.Z, min, max),
		);
	}

	export function ClampWithVector(
		vector: Vector3,
		min_vector: Vector3,
		max_vector: Vector3,
	) {
		return new Vector3(
			math.clamp(vector.X, min_vector.X, max_vector.X),
			math.clamp(vector.Y, min_vector.Y, max_vector.Y),
			math.clamp(vector.Z, min_vector.Z, max_vector.Z),
		);
	}

	export function LerpWithMagnitude(
		start_vector: Vector3,
		target_vector: Vector3,
		step: number,
	) {
		const difference = target_vector.sub(start_vector);
		//if difference is 0 return the target;
		if (difference.Magnitude === 0) return target_vector;
		step = min(difference.Magnitude, step);
		//add difference with magnitude of step;
		return start_vector.add(difference.Unit.mul(step));
	}

	export function ClampMagnitude(vector: Vector3, min: number, max: number) {
		if (vector.Magnitude > max || vector.Magnitude < min) {
			//sets the magnitude to clamped value;
			vector = vector.Unit.mul(clamp(vector.Magnitude, min, max));
		}
		return vector;
	}

	/**
	 * @returns mirrors a around b
	 */
	export function Mirror(a: Vector3, b: Vector3) {
		return b.add(b.sub(a));
	}

	/**
	 * will not return nan if Vector3.zero is normalized
	 */
	export function Normalize(vector: Vector3) {
		return vector.FuzzyEq(Vector3.zero, 1e-5) ? Vector3.zero : vector.Unit;
	}

	export function Slerp(start: Vector3, finish: Vector3, alpha: number) {
		start = Normalize(start);
		finish = Normalize(finish);
		const dot = math.clamp(start.Dot(finish), -1, 1);

		const theta = math.acos(dot) * alpha;
		const relative_vector = Normalize(finish.sub(start.mul(dot)));

		return start.mul(math.cos(theta)).add(relative_vector.mul(math.sin(theta)));
	}

	export function InverseSlerp(a: Vector3, b: Vector3, x: Vector3) {
		const a_dot_b = a.Dot(b);
		const a_cross_b = a.Cross(b);
		const a_dot_c = a.Dot(x);
		const a_cross_c = a.Cross(x);

		const projection_angle = math.atan2(
			a_cross_b.Dot(a_cross_c),
			a_cross_b.Magnitude * a_dot_c,
		);
		const full_angle = math.atan2(a_cross_b.Magnitude, a_dot_b);

		return projection_angle / full_angle;
	}

	export function InverseLerp(a: Vector3, b: Vector3, x: Vector3) {
		const a_1 = a.sub(x);
		const b_1 = b.sub(a);

		const t = a_1.Dot(b_1) / b_1.Dot(b_1);
		return t;
	}

	/**
	 *
	 * @param vector
	 * @returns turns every nan component into 0
	 */
	export function FixVector3(vector: Vector3) {
		if (vector === vector) return vector;
		return new Vector3(
			vector.X === vector.X ? vector.X : 0,
			vector.Y === vector.Y ? vector.Y : 0,
			vector.Z === vector.Z ? vector.Z : 0,
		);
	}

	export const vector3_inf = new Vector3(math.huge, math.huge, math.huge);
	export const vector3_neg_inf = vector3_inf.mul(-1);
	/**
	 * same as Vector3.Min but not limited by limitation of unpack
	 * @param vector
	 */
	export function Min(vectors: readonly Vector3[]) {
		if (vectors.size() === 0) return Vector3.zero;
		const splitted_vector_arrays = ArrayTools.SplitArray(vectors, 1000);
		let min = vector3_inf;
		for (const vector_array of splitted_vector_arrays) {
			min = min.Min(...vector_array);
		}
		return min;
	}

	/**
	 * same as Vector3.Min but not limited by limitation of unpack
	 * @param vectors
	 * @returns
	 */
	export function Max(vectors: readonly Vector3[]) {
		if (vectors.size() === 0) return Vector3.zero;
		const splitted_vector_arrays = ArrayTools.SplitArray(vectors, 1000);
		let max = vector3_neg_inf;
		for (const vector_array of splitted_vector_arrays) {
			max = max.Max(...vector_array);
		}
		return max;
	}

	const random = new Random();
	export function RandomVector(min?: Vector3, max?: Vector3) {
		if (min !== undefined || max !== undefined) {
			assert(min !== undefined, "Min is nil");
			assert(max !== undefined, "Max is nil");
		}
		if (min === undefined) {
			return random.NextUnitVector();
		}
		const size = max!.sub(min);
		return min.add(
			size.mul(new Vector3(math.random(), math.random(), math.random())),
		);
	}
}
