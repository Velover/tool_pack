//!native
//!optimize 2

import { CFrameTools } from "./cframe_tools";
import { Vector } from "./classes/vector";

export namespace MatrixTools {
	export type Matrix = number[][];
	export type Vector3Matrix = Vector3[][];
	export type VectorMatrix = Vector[][];
	export type CFrameMatrix = CFrame[][];

	export function MultiplyMatrices(matrix_1: Matrix, matrix_2: Matrix) {
		const collums_1 = matrix_1[0].size();
		const rows_1 = matrix_1.size();

		const collums_2 = matrix_2[0].size();
		const rows_2 = matrix_2.size();

		assert(
			collums_1 === rows_2,
			"matrix_1 collums should be equal matrix_2 rows",
		);
		const out_matrix = new Array<Array<number>>(rows_1);
		for (const i of $range(0, rows_1 - 1)) {
			out_matrix[i] = new Array<number>(collums_2);
		}

		for (const y_1 of $range(0, rows_1 - 1)) {
			const out_row = out_matrix[y_1];
			for (const x_2 of $range(0, collums_2 - 1)) {
				let summ = 0;
				for (const x_1 of $range(0, collums_1 - 1)) {
					summ += matrix_1[y_1][x_1] * matrix_2[x_1][x_2];
				}
				out_row[x_2] = summ;
			}
		}

		return out_matrix;
	}

	export function MultiplyNumberByVector3(
		matrix_1: Matrix,
		matrix_2: Vector3Matrix,
	) {
		const collums_1 = matrix_1[0].size();
		const rows_1 = matrix_1.size();

		const collums_2 = matrix_2[0].size();
		const rows_2 = matrix_2.size();

		assert(
			collums_1 === rows_2,
			"matrix_1 collums should be equal matrix_2 rows",
		);
		const out_matrix = new Array<Array<Vector3>>(rows_1);
		for (const i of $range(0, rows_1 - 1)) {
			out_matrix[i] = new Array<Vector3>(collums_2);
		}

		for (const y_1 of $range(0, rows_1 - 1)) {
			const out_row = out_matrix[y_1];
			for (const x_2 of $range(0, collums_2 - 1)) {
				let summ = Vector3.zero;
				for (const x_1 of $range(0, collums_1 - 1)) {
					summ = summ.add(matrix_2[x_1][x_2].mul(matrix_1[y_1][x_1]));
				}
				out_row[x_2] = summ;
			}
		}

		return out_matrix;
	}

	const AddCFrames = CFrameTools.AddCFrames;
	const MulCFrameByNumber = CFrameTools.MulCFrameByNumber;
	export function MultiplyNumberByCFrame(
		matrix_1: Matrix,
		matrix_2: CFrameMatrix,
	) {
		const collums_1 = matrix_1[0].size();
		const rows_1 = matrix_1.size();

		const collums_2 = matrix_2[0].size();
		const rows_2 = matrix_2.size();

		assert(
			collums_1 === rows_2,
			"matrix_1 collums should be equal matrix_2 rows",
		);
		const out_matrix = new Array<Array<CFrame>>(rows_1);
		for (const i of $range(0, rows_1 - 1)) {
			out_matrix[i] = new Array<CFrame>(collums_2);
		}

		for (const y_1 of $range(0, rows_1 - 1)) {
			const out_row = out_matrix[y_1];
			for (const x_2 of $range(0, collums_2 - 1)) {
				let summ = CFrame.identity;
				for (const x_1 of $range(0, collums_1 - 1)) {
					summ = AddCFrames(
						summ,
						MulCFrameByNumber(matrix_2[x_1][x_2], matrix_1[y_1][x_1]),
					);
				}
				out_row[x_2] = summ;
			}
		}

		return out_matrix;
	}

	export function MultiplyNumberByVector(
		matrix_1: Matrix,
		matrix_2: VectorMatrix,
	) {
		//takes the size of the virst vector
		const vector_size = matrix_2[0][0].GetSize();
		const collums_1 = matrix_1[0].size();
		const rows_1 = matrix_1.size();

		const collums_2 = matrix_2[0].size();
		const rows_2 = matrix_2.size();

		assert(
			collums_1 === rows_2,
			"matrix_1 collums should be equal matrix_2 rows",
		);
		const out_matrix = new Array<Array<Vector>>(rows_1);
		for (const i of $range(0, rows_1 - 1)) {
			out_matrix[i] = new Array<Vector>(collums_2);
		}

		for (const y_1 of $range(0, rows_1 - 1)) {
			const out_row = out_matrix[y_1];
			for (const x_2 of $range(0, collums_2 - 1)) {
				let summ = Vector.CreateWithValue(0, vector_size);
				for (const x_1 of $range(0, collums_1 - 1)) {
					summ = summ.Add(matrix_2[x_1][x_2].MulNum(matrix_1[y_1][x_1]));
				}
				out_row[x_2] = summ;
			}
		}

		return out_matrix;
	}

	export function MultiplyScalarByNumber(scalar: number, matrix: Matrix) {
		const rows = matrix.size();
		const collums = matrix[0].size();
		const out_matrix = new Array<Array<number>>(rows);
		for (const y of $range(0, rows - 1)) {
			const row = new Array<number>(collums);
			for (const x of $range(0, collums - 1)) {
				row[x] = matrix[y][x] * scalar;
			}
			out_matrix[y] = row;
		}
		return out_matrix;
	}
}
