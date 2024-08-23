//!native
//!optimize 2
export type Polygon2D = readonly Vector2[];
export namespace DetectingTools2D {
	/**@see https://stackoverflow.com/questions/10962379/how-to-check-intersection-between-2-rotated-rectangles */
	export function ArePolygonsIntersecting(a: Polygon2D, b: Polygon2D) {
		for (const polygon of [a, b]) {
			for (let i1 = 0; i1 < polygon.size(); i1++) {
				const i2 = (i1 + 1) % polygon.size();
				const p1 = polygon[i1];
				const p2 = polygon[i2];
				const normal = new Vector2(p2.Y - p1.Y, p1.X - p2.X);

				let min_a = undefined;
				let max_a = undefined;
				for (const p of a) {
					const projected = normal.X * p.X + normal.Y * p.Y;
					if (min_a === undefined || projected < min_a) {
						min_a = projected;
					}
					if (max_a === undefined || projected > max_a) {
						max_a = projected;
					}
				}

				let min_b = undefined;
				let max_b = undefined;
				for (const p of b) {
					const projected = normal.X * p.X + normal.Y * p.Y;
					if (min_a === undefined || projected < min_a) {
						min_b = projected;
					}
					if (max_a === undefined || projected > max_a) {
						max_b = projected;
					}
				}
				if (max_a! < min_b! || max_b! < min_a!) return false;
			}
		}
		return true;
	}
	export function IsPointInPolygon(point: Vector2, polygon: Polygon2D) {
		const nvert = polygon.size();
		let c = false;
		for (let i = 0, j = nvert - 1; i < nvert; j = i++) {
			if (
				polygon[i].Y > point.Y !== polygon[j].Y > point.Y &&
				point.X <
					((polygon[j].X - polygon[i].X) * (point.Y - polygon[i].Y)) /
						(polygon[j].Y - polygon[i].Y) +
						polygon[i].X
			)
				c = !c;
		}
		return c;
	}
	export function GetLineIntersection(
		p0: Vector2,
		p1: Vector2,
		p2: Vector2,
		p3: Vector2,
	) {
		const s1 = p1.sub(p0);
		const s2 = p3.sub(p2);
		const s =
			(-s1.Y * (p0.X - p2.X) + s1.X * (p0.Y - p2.Y)) /
			(-s2.X * s1.Y + s1.X * s2.Y);
		const t =
			(s2.X * (p0.Y - p2.Y) - s2.Y * (p0.X - p2.X)) /
			(-s2.X * s1.Y + s1.X * s2.Y);
		if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
			return new Vector2(p0.X + t * s1.X, p0.Y + t * s1.Y);
		}
	}

	export function IsFullyContained(
		polygon_parent: Polygon2D,
		polygon_contained: Polygon2D,
	) {
		const min_parent = polygon_parent[0].Min(polygon_parent as never);
		const max_parent = polygon_parent[0].Max(polygon_parent as never);

		const min_contained = polygon_contained[0].Min(polygon_contained as never);
		const max_contained = polygon_contained[0].Max(polygon_contained as never);

		return (
			min_contained.X >= min_parent.X &&
			min_contained.Y >= min_parent.Y &&
			max_contained.X <= max_parent.X &&
			max_contained.Y <= max_parent.Y
		);
	}

	export function IsPointInRect(point: Vector2, rect: Rect) {
		return (
			point.X >= rect.Min.X &&
			point.Y >= rect.Min.Y &&
			point.X <= rect.Max.X &&
			point.Y <= rect.Max.Y
		);
	}
}
