//!native
//!optimize 2

import { CFrameTools } from "./cframe_tools";
import { Vector3Tools } from "./vector3_tools";
import { Vector } from "./classes";
import { MatrixTools } from "./matrix_tools";

//TODO finish
export namespace SplineTools {
	const b_spline_matrix = MatrixTools.MultiplyScalarByNumber(1 / 6, [
		[1, 4, 1, 0],
		[-3, 0, 3, 0],
		[3, -6, 3, 0],
		[-1, 3, -3, 1],
	]);

	const bezier_spline_matrix = identity<MatrixTools.Matrix>([
		[1, 0, 0, 0],
		[-3, 3, 0, 0],
		[3, -6, 3, 0],
		[-1, 3, -3, 1],
	]);

	const catmull_rom_sline_matrix = MatrixTools.MultiplyScalarByNumber(1 / 2, [
		[0, 2, 0, 0],
		[-1, 0, 1, 0],
		[2, -5, 4, -1],
		[-1, 3, -3, 1],
	]);

	export const enum EBezierType {
		b_spline,
		bezier,
		catmull_rom,
	}
	const matrices = {
		[EBezierType.b_spline]: b_spline_matrix,
		[EBezierType.bezier]: bezier_spline_matrix,
		[EBezierType.catmull_rom]: catmull_rom_sline_matrix,
	};
	//TODO hermite spline

	/**
	 * @link https://www.youtube.com/watch?v=jvPPXbo87ds&ab_channel=FreyaHolm%C3%A9r
	 */
	export function GetSpline(
		points: Vector3[],
		t: number,
		bezier_type: EBezierType,
	) {
		const points_matrix: MatrixTools.Vector3Matrix = [
			[points[0]],
			[points[1]],
			[points[2]],
			[points[3]],
		];

		const numbers_matrix = matrices[bezier_type];
		const t_matrix = [[1, t, t * t, t * t * t]];
		const bernstein_matrix = MatrixTools.MultiplyMatrices(
			t_matrix,
			numbers_matrix,
		);
		const summ = MatrixTools.MultiplyNumberByVector3(
			bernstein_matrix,
			points_matrix,
		);
		return summ[0][0];
	}

	export function GetSplineVector(
		points: Vector[],
		t: number,
		bezier_type: EBezierType,
	) {
		const points_matrix: MatrixTools.VectorMatrix = [
			[points[0]],
			[points[1]],
			[points[2]],
			[points[3]],
		];

		const numbers_matrix = matrices[bezier_type];
		const t_matrix = [[1, t, t * t, t * t * t]];
		const bernstein_matrix = MatrixTools.MultiplyMatrices(
			t_matrix,
			numbers_matrix,
		);
		const summ = MatrixTools.MultiplyNumberByVector(
			bernstein_matrix,
			points_matrix,
		);
		return summ[0][0];
	}

	export function GetSplineCFrame(
		points: CFrame[],
		t: number,
		bezier_type: EBezierType,
	) {
		const points_matrix: MatrixTools.CFrameMatrix = [
			[points[0]],
			[points[1]],
			[points[2]],
			[points[3]],
		];

		const numbers_matrix = matrices[bezier_type];
		const t_matrix = [[1, t, t * t, t * t * t]];
		const bernstein_matrix = MatrixTools.MultiplyMatrices(
			t_matrix,
			numbers_matrix,
		);
		const summ = MatrixTools.MultiplyNumberByCFrame(
			bernstein_matrix,
			points_matrix,
		);
		return summ[0][0];
	}

	/**
	 * used for the splines that dont start from the first point, extends the start and the end of the full path
	 * @returns $tuple([point_0, point_1, point_2, point_3], local_t);
	 */
	function Get4PointsWithExtention(points: Vector3[], t: number) {
		const size = points.size();
		assert(size > 1, "No enough points provided");
		//will break on 1;
		t = math.clamp(t, 0, 0.9999);

		const index_float = (size - 1) * t;
		const local_t = index_float % 1;
		const index = math.floor(index_float);
		//reflects point 1 around start to get pre start point

		const point_0 =
			points[index - 1] ?? Vector3Tools.Mirror(points[1], points[0]);
		const point_1 = points[index];
		const point_2 = points[index + 1];
		//reflects pre last point around last to get extention at the end
		const point_3 =
			points[index + 2] ??
			Vector3Tools.Mirror(points[size - 2], points[size - 1]);
		return $tuple([point_0, point_1, point_2, point_3], local_t);
	}

	/**
	 * used for the splines that dont start from the first point, extends the start and the end of the full path
	 * @returns $tuple([point_0, point_1, point_2, point_3], local_t);
	 */
	function Get4PointsWithExtentionVector(points: Vector[], t: number) {
		const size = points.size();
		assert(size > 1, "No enough points provided");
		//will break on 1;
		t = math.clamp(t, 0, 0.9999);

		const index_float = (size - 1) * t;
		const local_t = index_float % 1;
		const index = math.floor(index_float);
		//reflects point 1 around start to get pre start point
		const point_0 = points[index - 1] ?? points[1].MirrorAround(points[0]);
		const point_1 = points[index];
		const point_2 = points[index + 1];
		//reflects pre last point around last to get extention at the end
		const point_3 =
			points[index + 2] ?? points[size - 2].MirrorAround(points[size - 1]);
		return $tuple([point_0, point_1, point_2, point_3], local_t);
	}

	const MirrorPostionAround = CFrameTools.MirrorPositionAround;
	/**
	 * used for the splines that dont start from the first point, extends the start and the end of the full path
	 * @returns $tuple([point_0, point_1, point_2, point_3], local_t);
	 */
	function Get4PointsWithExtentionCFrame(points: CFrame[], t: number) {
		const size = points.size();
		assert(size > 1, "No enough points provided");
		//will break on 1;
		t = math.clamp(t, 0, 0.9999);

		const index_float = (size - 1) * t;
		const local_t = index_float % 1;
		const index = math.floor(index_float);
		//reflects point 1 around start to get pre start point
		const point_0 =
			points[index - 1] ?? MirrorPostionAround(points[1], points[0], true);
		const point_1 = points[index];
		const point_2 = points[index + 1];
		//reflects pre last point around last to get extention at the end
		const point_3 =
			points[index + 2] ??
			MirrorPostionAround(points[size - 2], points[size - 1], true);
		return $tuple([point_0, point_1, point_2, point_3], local_t);
	}

	export function InterpolateBSpline(points: Vector3[], t: number) {
		const [control_points, local_t] = Get4PointsWithExtention(points, t);
		return GetSpline(control_points, local_t, EBezierType.b_spline);
	}

	export function InterpolateBSplineVector(points: Vector[], t: number) {
		const [control_points, local_t] = Get4PointsWithExtentionVector(points, t);
		return GetSplineVector(control_points, local_t, EBezierType.b_spline);
	}
	export function InterpolateBSplineCFrame(points: CFrame[], t: number) {
		const [control_points, local_t] = Get4PointsWithExtentionCFrame(points, t);
		return GetSplineCFrame(control_points, local_t, EBezierType.b_spline);
	}

	export function InterpolateCatmullRom(points: Vector3[], t: number) {
		const [control_points, local_t] = Get4PointsWithExtention(points, t);
		return GetSpline(control_points, local_t, EBezierType.catmull_rom);
	}

	export function InterpolateCatmullRomVector(points: Vector[], t: number) {
		const [control_points, local_t] = Get4PointsWithExtentionVector(points, t);
		return GetSplineVector(control_points, local_t, EBezierType.catmull_rom);
	}
}
