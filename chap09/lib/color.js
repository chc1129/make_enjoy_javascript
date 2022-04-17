/**
 * 色ライブラリ（COLOR）
 *
 * @author Takuto Yanagida
 * @version 2020-11-27
 */


/**
 * ライブラリ変数
 */
const COLOR = (function () {

	'use strict';


	/**
	 *
	 * This class converts the CIELAB (L*a*b*) color system.
	 * By default, D65 is used as tristimulus value.
	 * Reference: http://en.wikipedia.org/wiki/Lab_color_space
	 *
	 * @author Takuto Yanagida
	 * @version 2020-12-08
	 *
	 */


	class Lab {

		// Conversion function
		static _func(x) {
			return (x > Lab._C1) ? Math.pow(x, 1 / 3) : (Lab._C2 * x + 16 / 116);
		}

		// Inverse conversion function
		static _invFunc(x) {
			return (x > Lab._C3) ? Math.pow(x, 3) : ((x - 16 / 116) * Lab._C4);
		}

		/**
		 * Convert CIE 1931 XYZ to CIE 1976 (L*, a*, b*).
		 * @param {number[]} xyz XYZ color
		 * @return {number[]} CIELAB color
		 */
		static fromXYZ([x, y, z]) {
			const fy = Lab._func(y / Lab.XYZ_TRISTIMULUS_VALUES[1]);
			return [
				116 * fy - 16,
				500 * (Lab._func(x / Lab.XYZ_TRISTIMULUS_VALUES[0]) - fy),
				200 * (fy - Lab._func(z / Lab.XYZ_TRISTIMULUS_VALUES[2])),
			];
		}

		/**
		 * Convert CIE 1931 XYZ to L* of CIE 1976 (L*, a*, b*).
		 * @param {number[]} xyz XYZ color
		 * @return {number} L*
		 */
		static lightnessFromXYZ([x, y, z]) {
			const fy = Lab._func(y / Lab.XYZ_TRISTIMULUS_VALUES[1]);
			return 116 * fy - 16;
		}

		/**
		 * Convert CIE 1976 (L*, a*, b*) to CIE 1931 XYZ.
		 * @param {number[]} lab L*, a*, b* of CIELAB color
		 * @return {number[]} XYZ color
		 */
		static toXYZ([ls, as, bs]) {
			const fy = (ls + 16) / 116;
			return [
				Lab._invFunc(fy + as / 500) * Lab.XYZ_TRISTIMULUS_VALUES[0],
				Lab._invFunc(fy) * Lab.XYZ_TRISTIMULUS_VALUES[1],
				Lab._invFunc(fy - bs / 200) * Lab.XYZ_TRISTIMULUS_VALUES[2],
			];
		}


		// Evaluation Functions ----------------------------------------------------


		/**
		 * Calculate the conspicuity degree.
		 * Reference: Effective use of color conspicuity for Re-Coloring system,
		 * Correspondences on Human interface Vol. 12, No. 1, SIG-DE-01, 2010.
		 * @param {number[]} lab L*, a*, b* of CIELAB color
		 * @return {number} Conspicuity degree [0, 180]
		 * TODO Consider chroma (ab radius of LAB)
		 */
		static conspicuityOf(lab) {
			return Evaluation.conspicuityOfLab(lab);
		}

		/**
		 * Calculate the color difference between the two colors.
		 * @param {number[]} lab1 L*, a*, b* of CIELAB color 1
		 * @param {number[]} lab2 L*, a*, b* of CIELAB color 2
		 * @return {number} Color difference
		 */
		static differenceBetween(lab1, lab2) {
			return Evaluation.differenceBetweenLab(lab1, lab2);
		}


		// Conversion Functions ----------------------------------------------------


		/**
		 * Convert CIELAB (L*a*b*) from rectangular coordinate format to polar coordinate format.
		 * @param {number[]} lab L*, a*, b* of rectangular coordinate format (CIELAB)
		 * @return {number[]} Color in polar format
		 */
		static toPolarCoordinate([ls, as, bs]) {
			const rad = (bs > 0) ? Math.atan2(bs, as) : (Math.atan2(-bs, -as) + Math.PI);
			const cs = Math.sqrt(as * as + bs * bs);
			const h = rad * 360 / (Math.PI * 2);
			return [ls, cs, h];
		}

		/**
		 * Convert CIELAB (L*a*b*) from polar coordinate format to rectangular coordinate format.
		 * @param {number[]} lab L*, C*, h of polar format (CIELAB)
		 * @return {number[]} Color in rectangular coordinate format
		 */
		static toOrthogonalCoordinate([ls, cs, h]) {
			const rad = h * (Math.PI * 2) / 360;
			const as = Math.cos(rad) * cs;
			const bs = Math.sin(rad) * cs;
			return [ls, as, bs];
		}

	}

	// Constants for simplification of calculation
	Lab._C1 = Math.pow(6, 3) / Math.pow(29, 3);      // (6/29)^3 = 0.0088564516790356308171716757554635
	Lab._C2 = Math.pow(29, 2) / Math.pow(6, 2) / 3;  // (1/3)*(29/6)^2 = 7.787037037037037037037037037037
	Lab._C3 = 6 / 29;                                // 6/29 = 0.20689655172413793103448275862069
	Lab._C4 = Math.pow(6, 2) / Math.pow(29, 2) * 3;  // 3*(6/29)^2 = 0.12841854934601664684898929845422

	/**
	 * D50 tristimulus value
	 * Reference: http://www.babelcolor.com/download/A%20review%20of%20RGB%20color%20spaces.pdf
	 */
	Lab.D50_xyz = [0.34567, 0.35850, 0.29583];
	Lab.D50_XYZ = [Lab.D50_xyz[0] / Lab.D50_xyz[1], 1, Lab.D50_xyz[2] / Lab.D50_xyz[1]];

	/**
	 * D65 tristimulus value
	 * Reference: http://www.babelcolor.com/download/A%20review%20of%20RGB%20color%20spaces.pdf
	 */
	Lab.D65_xyz = [0.31273, 0.32902, 0.35825];
	Lab.D65_XYZ = [Lab.D65_xyz[0] / Lab.D65_xyz[1], 1, Lab.D65_xyz[2] / Lab.D65_xyz[1]];

	/**
	 * XYZ tristimulus value
	 */
	Lab.XYZ_TRISTIMULUS_VALUES = Lab.D65_XYZ;

	/**
	 *
	 * This class converts the LMS color system.
	 *
	 * @author Takuto Yanagida
	 * @version 2020-12-07
	 *
	 */


	class LMS {

		/**
		 * Convert CIE 1931 XYZ to LMS.
		 * @param {number[]} xyz XYZ color
		 * @return {number[]} LMS color
		 */
		static fromXYZ([x, y, z]) {
			return [
				LMS.matrix[0][0] * x + LMS.matrix[0][1] * y + LMS.matrix[0][2] * z,
				LMS.matrix[1][0] * x + LMS.matrix[1][1] * y + LMS.matrix[1][2] * z,
				LMS.matrix[2][0] * x + LMS.matrix[2][1] * y + LMS.matrix[2][2] * z,
			];
		}

		/**
		 * Convert LMS to CIE 1931 XYZ.
		 * @param {number[]} lms LMS color
		 * @return {number[]} XYZ color
		 */
		static toXYZ([l, m, s]) {
			return [
				LMS.matrixInverse[0][0] * l + LMS.matrixInverse[0][1] * m + LMS.matrixInverse[0][2] * s,
				LMS.matrixInverse[1][0] * l + LMS.matrixInverse[1][1] * m + LMS.matrixInverse[1][2] * s,
				LMS.matrixInverse[2][0] * l + LMS.matrixInverse[2][1] * m + LMS.matrixInverse[2][2] * s,
			];
		}

	}

	/*
	 * Reference: F. Vienot, H. Brettel, and J.D. Mollon,
	 * Digital video colourmaps for checking the legibility of displays by dichromats,
	 * COLOR research and application, vol.24, no.4, pp.243-252, Aug. 1999.
	 */
	LMS.SMITH_POKORNY = [
		[ 0.15514, 0.54312, -0.03286],
		[-0.15514, 0.45684,  0.03286],
		[ 0.0,     0.0,      0.01608]
	];

	LMS.SMITH_POKORNY_INV = [
		[2.944812906606763, -3.500977991936487, 13.17218214714747],
		[1.000040001600064,  1.000040001600064,  0.0             ],
		[0.0,                0.0,               62.18905472636816]
	];

	LMS.BRADFORD = [
		[ 0.8951000,  0.2664000, -0.1614000],
		[-0.7502000,  1.7135000,  0.0367000],
		[ 0.0389000, -0.0685000,  1.0296000]
	];

	LMS.BRADFORD_INV = [
		[ 0.9869929, -0.1470543,  0.1599627],
		[ 0.4323053,  0.5183603,  0.0492912],
		[-0.0085287,  0.0400428,  0.9684867]
	];

	LMS.VON_KRIES = [
		[ 0.4002400, 0.7076000, -0.0808100],
		[-0.2263000, 1.1653200,  0.0457000],
		[ 0.0000000, 0.0000000,  0.9182200]
	];

	LMS.VON_KRIES_INV = [
		[1.8599364, -1.1293816,  0.2198974],
		[0.3611914,  0.6388125, -0.0000064],
		[0.0000000,  0.0000000,  1.0890636]
	];

	LMS.matrix        = LMS.SMITH_POKORNY;
	LMS.matrixInverse = LMS.SMITH_POKORNY_INV;

	/**
	 *
	 * This class converts the Linear RGB color system.
	 * It is targeted for Linear RGB which converted sRGB (D65).
	 * Reference: http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
	 *
	 * @author Takuto Yanagida
	 * @version 2020-12-07
	 *
	 */


	class LRGB {

		/**
		 * Convert Linear RGB to CIE 1931 XYZ.
		 * @param {number[]} lrgb Linear RGB color
		 * @return {number[]} XYZ color
		 */
		static toXYZ([lr, lg, lb]) {
			return [
				0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb,
				0.2126729 * lr + 0.7151522 * lg + 0.0721750 * lb,
				0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb,
			];
		}

		/**
		 * Convert CIE 1931 XYZ to Linear RGB.
		 * @param {number[]} xyz XYZ color
		 * @return {number[]} Linear RGB color
		 */
		static fromXYZ([x, y, z]) {
			return [
				 3.2404542 * x + -1.5371385 * y + -0.4985314 * z,
				-0.9692660 * x +  1.8760108 * y +  0.0415560 * z,
				 0.0556434 * x + -0.2040259 * y +  1.0572252 * z,
			];
		}


		// Inverse Conversion Functions --------------------------------------------


		/**
		 * Convert Linear RGB to sRGB (Gamma 2.2).
		 * @param {number[]} lrgb Linear RGB color
		 * @return {number[]} sRGB color
		 */
		static toRGB(lrgb) {
			return RGB.fromLRGB(lrgb);
		}

		/**
		 * Convert sRGB to Linear RGB (Gamma 2.2).
		 * @param {number[]} rgb sRGB color
		 * @return {number[]} sRGB color
		 */
		static fromRGB(rgb) {
			return RGB.toLRGB(rgb);
		}

		/**
		 * Convert Linear RGB to YIQ.
		 * @param {number[]} lrgb Linear RGB color
		 * @return {number[]} YIQ color
		 */
		static toYIQ(lrgb) {
			return YIQ.fromLRGB(lrgb);
		}

		/**
		 * Convert YIQ to Linear RGB.
		 * @param {number[]} yiq YIQ color
		 * @return {number[]} Linear RGB color
		 */
		static fromYIQ(yiq) {
			return YIQ.toLRGB(yiq);
		}

	}

	/**
	 *
	 * This class converts the sRGB color system.
	 * Reference: http://www.w3.org/Graphics/Color/sRGB.html
	 *
	 * @author Takuto Yanagida
	 * @version 2020-12-07
	 *
	 */


	class RGB {

		static _checkRange(vs, min, max) {
			let isSaturated = false;
			if (vs[0] > max) { vs[0] = max; isSaturated = true; }
			if (vs[0] < min) { vs[0] = min; isSaturated = true; }
			if (vs[1] > max) { vs[1] = max; isSaturated = true; }
			if (vs[1] < min) { vs[1] = min; isSaturated = true; }
			if (vs[2] > max) { vs[2] = max; isSaturated = true; }
			if (vs[2] < min) { vs[2] = min; isSaturated = true; }
			return isSaturated;
		}

		// Convert sRGB to Linear RGB (gamma correction).
		static _func(x) {
			return (x < 0.03928) ? (x / 12.92) : Math.pow((x + 0.055) / 1.055, 2.4);
		}

		// Convert Linear RGB to sRGB (inverse gamma correction).
		static _invFunc(x) {
			x = (x > 0.00304) ? (Math.pow(x, 1 / 2.4) * 1.055 - 0.055) : (x * 12.92);
			return x;
		}

		/**
		 * Convert sRGB (Gamma 2.2) to Linear RGB.
		 * @param {number[]} rgb sRGB color
		 * @return {number[]} Linear RGB color
		 */
		static toLRGB([r, g, b]) {
			return [
				RGB._func(r / 255),
				RGB._func(g / 255),
				RGB._func(b / 255),
			];
		}

		/**
		 * Convert Linear RGB to sRGB (Gamma 2.2).
		 * @param {number[]} lrgb Linear RGB color
		 * @return {number[]} sRGB color
		 */
		static fromLRGB([lr, lg, lb]) {
			const dest = [
				RGB._invFunc(lr) * 255 | 0,
				RGB._invFunc(lg) * 255 | 0,
				RGB._invFunc(lb) * 255 | 0,
			];
			RGB.isSaturated = RGB._checkRange(dest, 0, 255);
			return dest;
		}


		// Utilities ---------------------------------------------------------------


		/**
		 * Convert color integer to sRGB.
		 * @param {number} v Color integer
		 * @return {number[]} Color vector
		 */
		static fromColorInteger(v) {
			return [
				(v >> 16) & 0xFF,
				(v >>  8) & 0xFF,
				(v      ) & 0xFF,
			];
		}

		/**
		 * Convert sRGB to color integer.
		 * @param {number[]} rgb RGB
		 * @return {number} Color integer
		 */
		static toColorInteger([r, g, b]) {
			return (r << 16) | (g << 8) | b | 0xff000000;
		}


		// Inverse Conversion Functions --------------------------------------------


		/**
		 * Convert sRGB (Gamma 2.2) to CIELAB (L*a*b*).
		 * @param {number[]} rgb sRGB color
		 * @return {number[]} CIELAB color
		 */
		static toLab(rgb) {
			return Lab.fromXYZ(XYZ.fromLRGB(LRGB.fromRGB(rgb)));
		}

		/**
		 * Convert CIELAB (L*a*b*) to sRGB (Gamma 2.2).
		 * @param {number[]} lab L*, a*, b* of CIELAB color
		 * @return {number[]} sRGB color
		 */
		static fromLab(lab) {
			return RGB.fromLRGB(LRGB.fromXYZ(XYZ.fromLab(lab)));
		}

		/**
		 * Convert sRGB to CIE 1931 XYZ.
		 * @param {number[]} rgb sRGB color
		 * @return {number[]} XYZ color
		 */
		static toXYZ(rgb) {
			return LRGB.toXYZ(LRGB.fromRGB(rgb));
		}

		/**
		 * Convert CIE 1931 XYZ to sRGB.
		 * @param {number[]} xyz XYZ color
		 * @return {number[]} sRGB color
		 */
		static fromXYZ(xyz) {
			return RGB.fromLRGB(LRGB.fromXYZ(xyz));
		}

		/**
		 * Convert sRGB (Gamma 2.2) to Yxy.
		 * @param {number[]} rgb sRGB color
		 * @return {number[]} Yxy color
		 */
		static toYxy(rgb) {
			return Yxy.fromXYZ(XYZ.fromLRGB(LRGB.fromRGB(rgb)));
		}

		/**
		 * Convert Yxy to sRGB (Gamma 2.2).
		 * @param {number[]} yxy Yxy color
		 * @return {number[]} sRGB color
		 */
		static fromYxy(yxy) {
			return RGB.fromLRGB(LRGB.fromXYZ(XYZ.fromYxy(yxy)));
		}


		// Color Vision Characteristics Conversion ---------------------------------


		/**
		 * Convert sRGB to Lightness-only sRGB.
		 * @param {number[]} rgb sRGB color
		 * @return {number[]} Lightness-only sRGB color
		 */
		static toLightness(rgb) {
			const l = Lab.lightnessFromXYZ(XYZ.fromLRGB(LRGB.fromRGB(rgb)));
			return RGB.fromLRGB(LRGB.fromXYZ(XYZ.fromLab([l, 0, 0])));
		}

	}

	RGB.isSaturated = false;

	/**
	 *
	 * This class converts the CIE 1931 XYZ color system.
	 *
	 * @author Takuto Yanagida
	 * @version 2020-12-07
	 *
	 */


	class XYZ {


		// Inverse Conversion Functions --------------------------------------------


		/**
		 * Convert CIE 1931 XYZ to Linear RGB.
		 * @param {number[]} xyz XYZ color
		 * @return Linear RGB color
		 */
		static toLRGB(x, y, z) {
			return LRGB.fromXYZ(x, y, z);
		}

		/**
		 * Convert Linear RGB to CIE 1931 XYZ.
		 * @param {number[]} lrgb Linear RGB color
		 * @return {number[]} XYZ color
		 */
		static fromLRGB(lrgb) {
			return LRGB.toXYZ(lrgb);
		}

		/**
		 * Convert CIE 1931 XYZ to Yxy.
		 * @param {number[]} xyz XYZ color
		 * @return {number[]} Yxy color
		 */
		static toYxy(xyz) {
			return Yxy.fromXYZ(xyz);
		}

		/**
		 * Convert Yxy to CIE 1931 XYZ.
		 * @param {number[]} yxy Yxy color
		 * @return {number[]} XYZ color
		 */
		static fromYxy(yxy) {
			return Yxy.toXYZ(yxy);
		}

		/**
		 * Convert CIE 1931 XYZ to CIE 1976 (L*, a*, b*).
		 * @param {number[]} xyz XYZ color
		 * @return {number[]} CIELAB color
		 */
		static toLab(xyz) {
			return Lab.fromXYZ(xyz);
		}

		/**
		 * Convert CIE 1976 (L*, a*, b*) to CIE 1931 XYZ.
		 * @param {number[]} lab L*, a*, b* of CIELAB color
		 * @return {number[]} XYZ color
		 */
		static fromLab(lab) {
			return Lab.toXYZ(lab);
		}

		/**
		 * Convert CIE 1931 XYZ to LMS.
		 * @param {number[]} xyz XYZ color
		 * @return {number[]} LMS color
		 */
		static toLMS(xyz) {
			return LMS.fromXYZ(xyz);
		}

		/**
		 * Convert LMS to CIE 1931 XYZ.
		 * @param {number[]} lms LMS color
		 * @return {number[]} XYZ color
		 */
		static fromLMS(lms) {
			return LMS.toXYZ(lms);
		}

		/**
		 * Convert CIE 1931 XYZ to Munsell (HVC).
		 * @param {number[]} xyz XYZ color (standard illuminant D65)
		 * @return {number[]} Munsell color
		 */
		static toMunsell(xyz) {
			return Munsell.fromXYZ(xyz);
		}

		/**
		 * Convert Munsell (HVC) to CIE 1931 XYZ.
		 * @param {number[]} hvc Hue, value, chroma of Munsell color
		 * @return {number[]} XYZ color
		 */
		static fromMunsell(hvc) {
			return Munsell.toXYZ(hvc);
		}


		// Conversion of Standard Illuminant ---------------------------------------


		/**
		 * Convert CIE 1931 XYZ of standard illuminant C to CIE 1931 XYZ of standard illuminant D65.
		 * Reference: http://www.brucelindbloom.com/index.html?MunsellCalculator.html (Von Kries method)
		 * @param {number[]} xyz XYZ color (standard illuminant C)
		 * @return {number[]} XYZ of standard illuminant D65
		 */
		static fromIlluminantC([x, y, z]) {
			return [
				 0.9972812 * x + -0.0093756 * y + -0.0154171 * z,
				-0.0010298 * x +  1.0007636 * y +  0.0002084 * z,
				                                   0.9209267 * z,
			];
		}

		/**
		 * Convert CIE 1931 XYZ of standard illuminant D65 to CIE 1931 XYZ of standard illuminant C.
		 * Reference: http://www.brucelindbloom.com/index.html?MunsellCalculator.html (Von Kries method)
		 * @param {number[]} xyz XYZ color (standard illuminant D65)
		 * @return {number[]} XYZ of standard illuminant C
		 */
		static toIlluminantC([x, y, z]) {
			return [
				1.0027359 * x +  0.0093941 * y +  0.0167846 * z,
				0.0010319 * x +  0.9992466 * y + -0.0002089 * z,
				                                  1.0858628 * z,
			];
		}

	}

	/**
	 *
	 * This class converts the YIQ color system.
	 * Reference: http://en.wikipedia.org/wiki/YIQ
	 *
	 * @author Takuto Yanagida
	 * @version 2020-12-07
	 *
	 */


	class YIQ {

		/**
		 * Convert Linear RGB to YIQ.
		 * @param {number[]} lrgb Linear RGB color
		 * @return {number[]} YIQ color
		 */
		static fromLRGB([lr, lg, lb]) {
			return [
				0.2990   * lr +  0.5870   * lg +  0.1140   * lb,  // Y[0, 1]
				0.595716 * lr + -0.274453 * lg + -0.321263 * lb,  // I[-0.5957, 0.5957]
				0.211456 * lr + -0.522591 * lg +  0.311135 * lb,  // Q[-0.5226, 0.5226]
			];
		}

		/**
		 * Convert YIQ to Linear RGB.
		 * @param {number[]} yiq YIQ color
		 * @return {number[]} Linear RGB color
		 */
		static toLRGB([y, i, q]) {
			return [
				y +  0.9563 * i +  0.6210 * q,  // R[0, 1]
				y + -0.2721 * i + -0.6474 * q,  // G[0, 1]
				y + -1.1070 * i +  1.7046 * q,  // B[0, 1]
			];
		}

	}

	/**
	 *
	 * This class converts the Yxy color system.
	 *
	 * @author Takuto Yanagida
	 * @version 2020-12-07
	 *
	 */


	class Yxy {

		/**
		 * Convert CIE 1931 XYZ to Yxy.
		 * @param {number[]} xyz XYZ color
		 * @return {number[]} Yxy color
		 */
		static fromXYZ([x, y, z]) {
			const sum = x + y + z;
			if (sum === 0) return [y, 0.31273, 0.32902];  // White point D65
			return [y, x / sum, y / sum];
		}

		/**
		 * Convert Yxy to CIE 1931 XYZ.
		 * @param {number[]} yxy Yxy color
		 * @return {number[]} XYZ color
		 */
		static toXYZ([y, sx, sy]) {
			const d0 = sx * y / sy;
			if (Number.isNaN(d0)) {
				Yxy.isSaturated = false;
				return [0, 0, 0];
			}
			const d1 = y;
			const d2 = (1 - sx - sy) * y / sy;
			Yxy.isSaturated = (Lab.D65_XYZ[0] < d0 || Lab.D65_XYZ[1] < d1 || Lab.D65_XYZ[2] < d2);
			return [d0, d1, d2];
		}


		// Evaluation Function -----------------------------------------------------


		/**
		 * Calculate the basic categorical color of the specified color.
		 * @param {number[]} yxy Yxy color
		 * @return {string} Basic categorical color
		 */
		static categoryOf(yxy) {
			return Evaluation.categoryOfYxy(yxy);
		}

	}

	Yxy.isSaturated = false;

	/**
	 *
	 * This class converts the Munsell (HVC) color system.
	 * D65 is used as tristimulus value.
	 * Since conversion is performed by approximation based on the distance to the sample color, the conversion result is approximate value.
	 * Also, when H is -1, it is regarded as an achromatic color (N) in particular.
	 * Reference: http://www.cis.rit.edu/mcsl/online/munsell.php
	 *
	 * @author Takuto Yanagida
	 * @version 2020-12-08
	 *
	 */


	class Munsell {

		static _getXy(vi, h10, c) {
			if (c === 0) return Munsell._ILLUMINANT_C;
			return Munsell._TBL[vi][h10 / 25][c / 2];
		}

		// Find Y of XYZ (C) from Munsell's V (JIS).
		static _v2y(v) {
			if (v <= 1) return v * 0.0121;
			const v2 = v * v, v3 = v2 * v;
			const y = 0.0467 * v3 + 0.5602 * v2 - 0.1753 * v + 0.8007;
			return y / 100;
		}

		// Munsell's V is obtained from Y of XYZ (C) (JIS, Newton's method).
		static _y2v(y) {
			if (y <= 0.0121) return y / 0.0121;
			let v = 10;
			while (true) {
				const f = Munsell._v2y(v) * 100 - y * 100;
				const fp = 3 * 0.0467 * (v * v) + 2 * 0.5602 * v - 0.1753;
				const v1 = -f / fp + v;
				if (Math.abs(v1 - v) < 0.01) break;
				v = v1;
			}
			return v;
		}

		static _eq(a, b) {
			return Math.abs(a - b) < Munsell._EP;
		}

		static _eq0(a) {
			return Math.abs(a) < Munsell._EP;
		}

		// Find the Munsell value from xyY (standard illuminant C).
		static _yxy2mun([Y, x, y]) {
			const v = Munsell._y2v(Y);  // Find Munsell lightness

			// When the lightness is maximum 10
			if (Munsell._eq(v, Munsell._TBL_V[Munsell._TBL_V.length - 1])) {
				const hc = Munsell._interpolateHC(x, y, Munsell._TBL_V.length - 1);
				return [hc[0], v, hc[1]];
			}
			// When the lightness is 0 or the lightness is larger than the maximum 10, or when it is an achromatic color (standard illuminant C)
			if (Munsell._eq0(v) || Munsell._TBL_V[Munsell._TBL_V.length - 1] < v || (Munsell._eq(x, Munsell._ILLUMINANT_C[0]) && Munsell._eq(y, Munsell._ILLUMINANT_C[1]))) {
				return [0, v, 0];
			}
			// Obtain lower side
			let vi_l = -1;
			while (Munsell._TBL_V[vi_l + 1] <= v) ++vi_l;
			let hc_l = [0, 0];  // Hue and chroma of the lower side
			if (vi_l != -1) hc_l = Munsell._interpolateHC(x, y, vi_l);

			// Obtain upper side
			const vi_u = vi_l + 1;
			const hc_u = Munsell._interpolateHC(x, y, vi_u);

			// When the lightness on the lower side is the minimum 0, the hue is matched with the upper side, and the chroma is set to 0
			if (vi_l == -1) {
				hc_l[0] = hc_u[0]; hc_l[1] = 0;
			}
			const v_l = ((vi_l == -1) ? 0 : Munsell._TBL_V[vi_l]), v_h = Munsell._TBL_V[vi_u];
			const r = (v - v_l) / (v_h - v_l);
			let h = (hc_u[0] - hc_l[0]) * r + hc_l[0];
			if (Munsell._MAX_HUE <= h) h -= Munsell._MAX_HUE;
			let c = (hc_u[1] - hc_l[1]) * r + hc_l[1];
			if (c < Munsell.MONO_LIMIT_C) c = 0;
			return [h, v, c];
		}

		// Acquires the hue and chroma for the chromaticity coordinates (x, y) on the surface of the given lightness index.
		// If not included, -1 is returned.
		static _interpolateHC(x, y, vi) {
			let h10_l, h10_u = -1, c_l = -1, c_u = -1;
			let hv = null;

			out:
			for (h10_l = 0; h10_l <= 975; h10_l += 25) {  // h 0-975 step 25;
				h10_u = h10_l + 25;
				if (h10_u == 1000) h10_u = 0;

				inner:
				for (c_l = 0; c_l <= 50; c_l += 2) {  // c 0-50 step 2;
					c_u = c_l + 2;

					const a = Munsell._getXy(vi, h10_l, c_l), d = Munsell._getXy(vi, h10_l, c_u);
					const b = Munsell._getXy(vi, h10_u, c_l), c = Munsell._getXy(vi, h10_u, c_u);
					if (a == null && b == null) break inner;
					if (a == null || b == null || c == null || d == null) continue;
					//  ^
					// y| B C      ↖H (Direction of rotation) ↗C (Radial direction)
					//  | A D
					//  ------> x
					if (a[0] == b[0] && a[1] == b[1]) {
						if (Munsell._isInside(a, c, d, x, y)) hv = Munsell._interpolationRatio(x, y, a, d, b, c);
					} else {
						if (Munsell._isInside(a, c, d, x, y) || Munsell._isInside(a, b, c, x, y)) hv = Munsell._interpolationRatio(x, y, a, d, b, c);
					}
					if (hv != null) break out;
				}
			}
			if (hv === null) {
				return [0, 0];
			}
			if (h10_u == 0) h10_u = 1000;
			return [((h10_u - h10_l) * hv[0] + h10_l) / 10, (c_u - c_l) * hv[1] + c_l];
		}

		// Whether a point (x, y) exists within the interior (including the boundary) of the clockwise triangle abc
		// in the mathematical coordinate system (positive on the y axis is upward)
		static _isInside(a, b, c, x, y) {
			// If x, y are on the right side of ab, the point is outside the triangle
			if (Munsell._cross(x - a[0], y - a[1], b[0] - a[0], b[1] - a[1]) < 0) return false;
			// If x, y are on the right side of bc, the point is outside the triangle
			if (Munsell._cross(x - b[0], y - b[1], c[0] - b[0], c[1] - b[1]) < 0) return false;
			// If x, y are on the right side of ca, the point is outside the triangle
			if (Munsell._cross(x - c[0], y - c[1], a[0] - c[0], a[1] - c[1]) < 0) return false;
			return true;
		}

		static _cross(ax, ay, bx, by) {
			return ax * by - ay * bx;
		}

		/*
		 * Calculate the proportion [h, v] of each point in the area surrounded by the points of the following placement (null if it is invalid).
		 *  ^
		 * y| B C      ↖H (Direction of rotation) ↗C (Radial direction)
		 *  | A D
		 *  ------> x
		 */
		static _interpolationRatio(x, y, a, d, b, c) {
			// Find the ratio in the vertical direction
			let v = -1;

			// Solve a v^2 + b v + c = 0
			const ea = (a[0] - d[0]) * (a[1] + c[1] - b[1] - d[1]) - (a[0] + c[0] - b[0] - d[0]) * (a[1] - d[1]);
			const eb = (x - a[0]) * (a[1] + c[1] - b[1] - d[1]) + (a[0] - d[0]) * (b[1] - a[1]) - (a[0] + c[0] - b[0] - d[0]) * (y - a[1]) - (b[0] - a[0]) * (a[1] - d[1]);
			const ec = (x - a[0]) * (b[1] - a[1]) - (y - a[1]) * (b[0] - a[0]);

			if (Munsell._eq0(ea)) {
				if (!Munsell._eq0(eb)) v = -ec / eb;
			} else {
				const rt = Math.sqrt(eb * eb - 4 * ea * ec);
				const v1 = (-eb + rt) / (2 * ea), v2 = (-eb - rt) / (2 * ea);

				if (a[0] == b[0] && a[1] == b[1]) {  // In this case, v1 is always 0, but this is not a solution.
					if (0 <= v2 && v2 <= 1) v = v2;
				} else {
					if      (0 <= v1 && v1 <= 1) v = v1;
					else if (0 <= v2 && v2 <= 1) v = v2;
				}
			}
			if (v < 0) return null;

			// Find the ratio in the horizontal direction
			let h = -1, h1 = -1, h2 = -1;
			const deX = (a[0] - d[0] - b[0] + c[0]) * v - a[0] + b[0];
			const deY = (a[1] - d[1] - b[1] + c[1]) * v - a[1] + b[1];

			if (!Munsell._eq0(deX)) h1 = ((a[0] - d[0]) * v + x - a[0]) / deX;
			if (!Munsell._eq0(deY)) h2 = ((a[1] - d[1]) * v + y - a[1]) / deY;

			if      (0 <= h1 && h1 <= 1) h = h1;
			else if (0 <= h2 && h2 <= 1) h = h2;

			if (h < 0) return null;

			return [h, v];
		}

		/**
		 * Convert name-based hue expression to hue value.
		 * If the Name-based hue expression is N, -1 is returned.
		 * @param {string} hueName Name-based hue expression
		 * @return {number} Hue value
		 */
		static hueNameToHueValue(hueName) {
			if (hueName.length == 1) return -1;  // In case of achromatic color N

			function isDigit(s) { return Number.isInteger(parseInt(s)); }
			const slen = isDigit(hueName.charAt(hueName.length - 2)) ? 1 : 2;  // Length of color name
			const n = hueName.substring(hueName.length - slen);

			let hv = parseFloat(hueName.substring(0, hueName.length - slen));
			hv += Munsell._HUE_NAMES.indexOf(n) * 10;
			if (Munsell._MAX_HUE <= hv) hv -= Munsell._MAX_HUE;
			return hv;
		}

		/**
		 * Convert hue value to name-based hue expression.
		 * If the hue value is -1, or if the chroma value is 0, N is returned.
		 * @param {number} hue Hue value
		 * @param {number} chroma Chroma value
		 * @return {string} Name-based hue expression
		 */
		static hueValueToHueName(hue, chroma) {
			if (hue == -1 || Munsell._eq0(chroma)) return 'N';
			if (hue <= 0) hue += Munsell._MAX_HUE;
			let h10 = (0 | hue * 10) % 100;
			let c = 0 | (hue / 10);
			if (h10 === 0) {
				h10 = 100;
				c -= 1;
			}
			return (Math.round(h10 * 10) / 100) + Munsell._HUE_NAMES[c];
		}

		/**
		 * Convert CIE 1931 XYZ to Munsell (HVC).
		 * @param {number[]} xyz XYZ color (standard illuminant D65)
		 * @return {number[]} Munsell color
		 */
		static fromXYZ(xyz) {
			return Munsell._yxy2mun(Yxy.fromXYZ(XYZ.toIlluminantC(xyz)));
		}

		/**
		 * Convert Munsell (HVC) to CIE 1931 XYZ.
		 * @param {number[]} hvc Hue, value, chroma of Munsell color
		 * @return {number[]} XYZ color
		 */
		static toXYZ([h, v, c]) {
			if (Munsell._MAX_HUE <= h) h -= Munsell._MAX_HUE;
			const dest = [Munsell._v2y(v), 0, 0];
			Munsell.isSaturated = false;

			// When the lightness is 0 or achromatic (check this first)
			if (Munsell._eq0(v) || h < 0 || c < Munsell.MONO_LIMIT_C) {
				dest[1] = Munsell._ILLUMINANT_C[0]; dest[2] = Munsell._ILLUMINANT_C[1];
				Munsell.isSaturated = Munsell._eq0(v) && 0 < c;
				return XYZ.fromIlluminantC(Yxy.toXYZ(dest));
			}
			// When the lightness is the maximum value 10 or more
			if (Munsell._TBL_V[Munsell._TBL_V.length - 1] <= v) {
				const xy = Munsell._interpolateXY(h, c, Munsell._TBL_V.length - 1);
				dest[1] = xy[0]; dest[2] = xy[1];
				Munsell.isSaturated = (Munsell._TBL_V[Munsell._TBL_V.length - 1] < v);
				return XYZ.fromIlluminantC(Yxy.toXYZ(dest));
			}
			let vi_l = -1;
			while (Munsell._TBL_V[vi_l + 1] <= v) ++vi_l;
			const vi_u = vi_l + 1;

			// Obtain lower side
			let xy_l = [0, 0];
			if (vi_l != -1) {
				xy_l = Munsell._interpolateXY(h, c, vi_l);
				if (!xy_l[2]) Munsell.isSaturated = true;
			} else {  // When the lightness of the lower side is the minimum 0, use standard illuminant.
				xy_l[0] = Munsell._ILLUMINANT_C[0]; xy_l[1] = Munsell._ILLUMINANT_C[1];
				Munsell.isSaturated = true;
			}
			// Obtain upper side
			const xy_u = Munsell._interpolateXY(h, c, vi_u);
			if (!xy_u[2]) Munsell.isSaturated = true;

			const v_l = ((vi_l == -1) ? 0 : Munsell._TBL_V[vi_l]), v_h = Munsell._TBL_V[vi_u];
			const r = (v - v_l) / (v_h - v_l);
			const x = (xy_u[0] - xy_l[0]) * r + xy_l[0], y = (xy_u[1] - xy_l[1]) * r + xy_l[1];
			dest[1] = x; dest[2] = y;

			return XYZ.fromIlluminantC(Yxy.toXYZ(dest));
		}

		/**
		 * Convert Munsell (HVC) to PCCS (hls).
		 * @param {number[]} hvc Hue, value, chroma of Munsell color
		 * @return {number[]} PCCS color
		 */
		static toPCCS(hvc) {
			return PCCS.fromMunsell(hvc);
		}

		/**
		 * Convert PCCS (hls) to Munsell (HVC).
		 * @param {number[]} hls Hue, lightness, saturation of PCCS color
		 * @return {number[]} Munsell color
		 */
		static fromPCCS(hls) {
			return PCCS.toMunsell(hls);
		}

		// Obtain the hue and chroma for the chromaticity coordinates (h, c) on the surface of the given lightness index.
		// Return false if it is out of the range of the table.
		static _interpolateXY(h, c, vi) {
			const h10 = h * 10;
			let h10_l = 0 | Math.floor(h10 / 25) * 25, h10_u = h10_l + 25;
			const c_l = 0 | Math.floor(c / 2) * 2, c_u = c_l + 2;

			const rh = (h10 - h10_l) / (h10_u - h10_l);
			const rc = (c - c_l) / (c_u - c_l);

			if (h10_u == 1000) h10_u = 0;
			const maxC_hl = Munsell._TBL_MAX_C[vi][h10_l / 25], maxC_hu = Munsell._TBL_MAX_C[vi][h10_u / 25];

			if (maxC_hl <= c_l || maxC_hu <= c_l) {
				let xy_hl = [0, 0], xy_hu = [0, 0];

				if (c_l < maxC_hl) {
					const a = Munsell._getXy(vi, h10_l, c_l), d = Munsell._getXy(vi, h10_l, c_u);
					xy_hl[0] = (d[0] - a[0]) * rc + a[0]; xy_hl[1] = (d[1] - a[1]) * rc + a[1];
				} else {
					xy_hl = Munsell._getXy(vi, h10_l, maxC_hl);
				}
				if (c_l < maxC_hu) {
					const a = Munsell._getXy(vi, h10_u, c_l), d = Munsell._getXy(vi, h10_u, c_u);
					xy_hu[0] = (d[0] - a[0]) * rc + a[0]; xy_hu[1] = (d[1] - a[1]) * rc + a[1];
				} else {
					xy_hu = Munsell._getXy(vi, h10_u, maxC_hu);
				}
				return [
					(xy_hu[0] - xy_hl[0]) * rh + xy_hl[0],
					(xy_hu[1] - xy_hl[1]) * rh + xy_hl[1],
					false
				];
			}
			if (c_l == 0) {
				const o = Munsell._ILLUMINANT_C, d = Munsell._getXy(vi, h10_l, c_u), C = Munsell._getXy(vi, h10_u, c_u);
				const cd_x = (C[0] - d[0]) * rh + d[0], cd_y = (C[1] - d[1]) * rh + d[1];
				return [
					(cd_x - o[0]) * rc + o[0],
					(cd_y - o[1]) * rc + o[1],
					true
				];
			} else {
				const a = Munsell._getXy(vi, h10_l, c_l), d = Munsell._getXy(vi, h10_l, c_u);
				const b = Munsell._getXy(vi, h10_u, c_l), C = Munsell._getXy(vi, h10_u, c_u);
				const ab_x = (b[0] - a[0]) * rh + a[0], ab_y = (b[1] - a[1]) * rh + a[1];
				const cd_x = (C[0] - d[0]) * rh + d[0], cd_y = (C[1] - d[1]) * rh + d[1];
				return [
					(cd_x - ab_x) * rc + ab_x,
					(cd_y - ab_y) * rc + ab_y,
					true
				];
			}
		}

		/**
		 * Returns the string representation of Munsell numerical representation.
		 * @param {number[]} hvc Hue, value, chroma of Munsell color
		 * @return {string} String representation
		 */
		static toString([h, v, c]) {
			const vstr = Math.round(v * 10) / 10;
			if (c < Munsell.MONO_LIMIT_C) {
				return `N ${vstr}`;
			} else {
				const hue = Munsell.hueValueToHueName(h, c);
				const cstr = Math.round(c * 10) / 10;
				return `${hue} ${vstr}/${cstr}`;
			}
		}

	}

	Munsell.isSaturated = false;

	Munsell.MONO_LIMIT_C = 0.05;
	const _TBL_V_REAL = [1, 2, 3, 4, 5, 6, 7, 8, 9];
	const _TBL_V_ALL = [0.2, 0.4, 0.6, 0.8, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	Munsell._TBL_V = _TBL_V_REAL;
	Munsell._MIN_HUE = 0;
	Munsell._MAX_HUE = 100;  // Same as MIN_HUE
	Munsell._HUE_NAMES = ['R', 'YR', 'Y', 'GY', 'G', 'BG', 'B', 'PB', 'P', 'RP'];  // 1R = 1, 9RP = 99, 10RP = 0
	Munsell._EP = 0.0000000000001;
	Munsell._ILLUMINANT_C = [0.3101, 0.3162];  // Standard illuminant C, white point
	Munsell._TBL_MAX_C = new Array(Munsell._TBL_V.length);
	Munsell._TBL = new Array(Munsell._TBL_V.length);  // [vi][10 * h / 25][c / 2] -> [x, y]

	function _initTable() {
		for (let vi = 0; vi < Munsell._TBL_V.length; vi += 1) {
			Munsell._TBL_MAX_C[vi] = new Array(1000 / 25);
			Munsell._TBL_MAX_C[vi].fill(0);
			Munsell._TBL[vi] = new Array(1000 / 25);
			for (let i = 0, n = 1000 / 25; i < n; i += 1) Munsell._TBL[vi][i] = new Array(50 / 2 + 2);  // 2 <= C <= 51

			for (const cs of Munsell._TBL_SRC_MIN[vi]) {
				const c0 = cs.shift();
				_integrate(cs);
				_integrate(cs);
				for (let i = 0; i < cs.length; i += 2) {
					const c1 = i / 2 + 1;
					const c2 = cs[i + 0] / 1000;
					const c3 = cs[i + 1] / 1000;
					Munsell._TBL[vi][c0][c1] = [c2, c3];
					if (Munsell._TBL_MAX_C[vi][c0] < c1 * 2) {
						Munsell._TBL_MAX_C[vi][c0] = c1 * 2;
					}
				}
			}
		}
		function _integrate(cs) {
			let c2_ = 0, c3_ = 0;
			for (let i = 0; i < cs.length; i += 2) {
				const c2 = cs[i], c3 = cs[i + 1];
				cs[i]     = c2 + c2_;
				cs[i + 1] = c3 + c3_;
				c2_ += c2;
				c3_ += c3;
			}
		}
	}

	Munsell._TBL_SRC_MIN = [
		[
			[0,363,271,-334,-300,-6,4,-2,0,-5,4,-1,1],
			[1,377,282,-337,-307,-5,1,-6,1,-4,3],
			[2,391,293,-340,-313,-4,-1,-8,-1,-7,2],
			[3,402,303,-338,-317,-6,-5,-10,-2,-9,1],
			[4,413,315,-333,-323,-15,-7,-5,-6,-12,0],
			[5,426,334,-321,-331,-31,-13,-7,-11],
			[6,438,358,-310,-336],
			[7,443,378],
			[8,445,398],
			[9,436,418],
			[10,423,427],
			[11,404,429],
			[12,380,421],
			[13,354,409],
			[14,336,398,-295,-202],
			[15,315,384,-317,-230],
			[16,301,372,-330,-254,-20,31],
			[17,291,363,-337,-277,-28,27,-35,15],
			[18,283,356,-337,-290,-28,12,-9,-7],
			[19,276,348,-336,-299,-22,5,1,-11],
			[20,269,341,-334,-310,-14,-1,5,-16],
			[21,260,329,-332,-317,1,-8,2,-3],
			[22,250,314,-325,-326,9,-4],
			[23,243,302,-316,-327,9,-3],
			[24,236,288,-306,-326,11,1],
			[25,232,278,-299,-324,14,5],
			[26,229,268,-291,-319,16,9],
			[27,229,258,-286,-311,15,12,9,5],
			[28,231,249,-284,-301,14,11,8,7],
			[29,236,242,-282,-293,10,9,9,9],
			[30,243,237,-285,-287,9,8,10,9,7,8],
			[31,255,231,-287,-280,9,9,10,12,6,9,3,4,2,4,0,0,1,5,0,-1,1,2,-1,0,1,1,0,0,-1,0,1,1,0,1,0,0,0,0],
			[32,268,228,-290,-273,5,9,7,12,3,4,2,4,2,4,0,1,1,3,1,1,0,2,-1,-1,1,1,1,0,-1,1],
			[33,281,230,-295,-273,4,12,3,5,1,7,1,2,2,4,0,2,1,3,1,0,-1,1,1,2,-1,-1],
			[34,294,233,-303,-273,3,10,1,5,1,5,1,3,1,2,0,4,0,3,1,0,0,0],
			[35,303,236,-307,-275,1,10,0,4,1,5,-1,3,2,1,-1,5,1,3,0,0],
			[36,313,240,-313,-277,0,8,-2,3,1,6,0,3,0,1,1,5,-1,2],
			[37,324,246,-319,-282,-2,7,-1,3,-1,6,0,3,0,1,-1,4],
			[38,338,254,-326,-288,-3,6,-2,2,0,6,-3,2,0,4],
			[39,350,262,-329,-294,-5,6,-2,1,-2,4,-1,3]
		],
		[
			[0,353,296,-321,-314,-3,1,0,-2,-4,1,-2,0,-1,1],
			[1,361,303,-320,-316,-4,-1,2,-3,-5,1,-2,-2,-3,1],
			[2,369,311,-320,-319,-3,-2,4,-3,-8,-4,-5,1,0,-2],
			[3,375,318,-316,-319,-5,-4,1,-4,-3,-7,-8,-1,-4,-1],
			[4,381,327,-314,-321,-6,-6,1,-7,-8,-7,-6,-4,-4,-3],
			[5,385,337,-310,-323,-7,-7,4,-6],
			[6,388,348,-309,-322,-3,-7],
			[7,389,359,-309,-322,-1,-6],
			[8,387,369,-306,-321],
			[9,383,379,-303,-319],
			[10,376,384,-298,-311],
			[11,366,386,-292,-300],
			[12,356,385,-293,-291],
			[13,342,380,-296,-285],
			[14,331,374,-304,-283,-1,19],
			[15,317,365,-309,-284,-7,11,-11,21],
			[16,307,358,-315,-292,-6,7,-8,14,-10,10,-8,2],
			[17,298,351,-320,-302,-5,3,-3,0,-12,14,-4,-5,-3,-6,0,-5],
			[18,292,345,-320,-305,-4,-2,-2,-3,-8,5,-2,-2,1,-5,2,-3],
			[19,287,340,-320,-309,-1,-4,-2,-1,-4,1,-2,-2,3,-4,4,-3],
			[20,282,334,-320,-312,3,-4,-3,-1,-1,-2,0,-3,6,-3,2,-3],
			[21,277,327,-320,-316,6,-4,-4,0,4,-4,3,0,5,-2],
			[22,270,318,-317,-321,8,-1,-4,-3,7,-1,8,0],
			[23,265,310,-314,-322,8,-1,-1,-1,8,1,7,3],
			[24,261,301,-312,-323,8,0,2,-2,8,4],
			[25,258,294,-310,-323,8,0,5,1,7,3],
			[26,256,287,-307,-322,8,-1,6,3,9,6],
			[27,255,280,-304,-320,9,3,5,3,9,7],
			[28,256,273,-302,-315,8,5,6,3,8,9],
			[29,259,268,-300,-311,6,4,6,6,8,8,5,5],
			[30,264,262,-302,-305,6,5,7,6,6,7,5,6,3,1],
			[31,271,258,-300,-301,6,7,5,7,5,5,6,7,2,4,2,1,0,2,2,3,-1,-1,1,3,0,0,1,1,-1,0,1,0,-1,1,1,0,-1,0],
			[32,280,257,-300,-298,4,9,1,3,6,7,3,6,1,2,1,2,1,2,1,1,0,1,0,2,1,0,0,1,0,0,0,1,0,0],
			[33,289,258,-302,-295,3,8,1,1,2,6,2,5,1,2,0,3,2,1,-1,2,1,1,0,0,0,2,1,-1,-1,1],
			[34,298,261,-305,-296,1,8,0,-1,2,7,0,3,1,2,0,5,1,0,0,1,1,1,-1,1,1,0,0,2],
			[35,307,265,-309,-298,0,7,-1,-2,1,7,0,3,0,3,0,2,1,2,0,1,0,0,0,2],
			[36,316,269,-313,-299,-1,4,-1,-1,0,7,-1,2,1,2,-1,2,-1,2,1,2,0,0],
			[37,328,275,-318,-300,-1,1,0,-2,-3,6,-1,2,-1,1,0,3,-1,2,-1,1],
			[38,338,283,-320,-306,-3,1,0,-2,-4,4,0,2,-1,2,-1,1,-2,4],
			[39,346,289,-322,-310,-2,2,0,-2,-4,1,-2,2,-2,2,-2,2]
		],
		[
			[0,353,307,-317,-317,-3,-1,0,-1,-3,0,-1,-1,-5,1,1,-1],
			[1,359,313,-316,-318,-4,-2,2,-2,-4,-2,-2,-1,-6,1,0,-1],
			[2,365,319,-315,-319,-6,-2,3,-4,-3,-3,-6,-3,-6,1,0,-2],
			[3,369,325,-314,-320,-5,-3,1,-4,-3,-4,-5,-5,-10,-1,0,-2],
			[4,373,331,-315,-321,-4,-4,0,-5,-6,-5,-3,-4,-7,-3],
			[5,376,339,-316,-322,-1,-4,-6,-5,-7,-3],
			[6,377,348,-316,-324,-2,-5,-10,-6],
			[7,377,355,-316,-323,-6,-7,-9,-6],
			[8,375,363,-316,-324,-6,-8,-9,-8],
			[9,370,370,-312,-323,-8,-11],
			[10,365,375,-311,-322,-6,-10],
			[11,359,378,-309,-318,-6,-9],
			[12,351,379,-306,-313,-6,-8],
			[13,341,377,-305,-306,-6,-8],
			[14,332,373,-309,-303,-3,-2,-3,4],
			[15,318,364,-309,-299,-3,3,-5,5,-8,2],
			[16,309,358,-313,-304,-2,6,-4,4,-7,3,-2,0,-6,5],
			[17,300,350,-316,-308,-4,0,0,-1,-7,5,0,-3,0,-2,-2,-4,0,-2,-4,1,0,-2],
			[18,294,344,-317,-310,-1,-2,0,-4,-5,2,1,-3,0,-2,2,-4,2,-1,-2,-1,-2,2],
			[19,289,339,-316,-311,0,-5,1,-3,-3,1,1,-1,2,-4,2,-1,2,-2,-1,0,-1,0],
			[20,284,334,-315,-314,2,-4,2,-2,-1,-1,0,0,3,-4,2,0,2,-3,2,-1,-1,0],
			[21,280,327,-316,-315,5,-4,3,-2,-2,-1,4,-1,2,-1,3,-1,2,-1,2,1],
			[22,274,319,-314,-318,8,-2,0,-2,3,-1,4,-1,3,1,2,-1,4,1],
			[23,270,312,-313,-320,9,0,3,-1,2,0,5,2,2,-1,4,1],
			[24,266,305,-310,-321,8,-1,5,2,1,-1,7,3,1,0],
			[25,264,298,-310,-321,11,2,3,0,3,1,6,3],
			[26,262,292,-306,-321,10,4,3,-1,4,2,5,4],
			[27,262,286,-304,-318,10,4,2,1,6,4,3,1],
			[28,263,280,-301,-313,6,3,5,4,4,3,3,1,4,5],
			[29,266,276,-301,-311,6,4,5,4,4,4,2,3,3,2],
			[30,271,272,-303,-308,5,5,6,6,2,1,3,4,3,2,2,2,2,4],
			[31,278,269,-304,-306,5,6,5,6,2,3,3,3,3,3,3,2,1,4,1,2,1,-1,0,2,0,2,1,0,0,0,0,0,1,2],
			[32,285,267,-304,-302,4,6,3,5,1,2,4,6,0,0,2,3,2,3,0,1,0,1,1,0,0,2,1,0,0,1,0,-1,0,2],
			[33,292,268,-305,-302,3,7,3,5,0,1,2,5,0,1,1,2,1,2,0,2,1,0,0,1,0,2,0,-1,0,1,1,1,0,0],
			[34,300,270,-307,-301,1,6,1,2,0,3,2,3,0,3,0,1,1,2,0,2,0,0,0,0,1,2,0,0,0,1,0,0],
			[35,309,274,-311,-303,1,5,-1,1,0,4,0,2,1,3,0,2,0,0,0,3,0,0,0,0,1,1,-1,0,0,2],
			[36,317,279,-313,-306,-1,4,0,2,-1,2,-1,2,0,2,0,4,0,-2,-1,4,1,0,-1,0,0,1],
			[37,327,286,-314,-310,-3,5,0,-1,-2,2,-1,3,0,1,-1,1,-1,1,-1,2,1,-1],
			[38,337,294,-315,-314,-4,3,-2,0,-2,1,-1,1,-2,0,0,2,-3,2,0,0],
			[39,345,300,-316,-315,-4,1,-1,-1,-2,1,-2,-1,-2,2,-2,0,-2,1]
		],
		[
			[0,342,311,-312,-318,-2,0,0,-1,-3,0,1,-1,-3,-1,-2,1,3,-2,-4,1],
			[1,346,315,-311,-317,-2,-2,0,-2,-3,0,0,-1,0,-2,-5,0,3,-1],
			[2,351,320,-310,-318,-3,-1,1,-3,-4,-1,0,-2,-1,-2,-3,-1,-2,-2],
			[3,354,324,-309,-318,-2,-2,0,-2,-4,-3,-3,-2,0,-2,-6,-3,-2,-1,-1,-2],
			[4,358,329,-308,-317,-4,-3,0,-3,-4,-4,-4,-1,-3,-3,-9,-2],
			[5,362,337,-310,-320,-5,-4,-1,-2,-5,-3,-8,-3],
			[6,365,344,-311,-320,-8,-6,-4,-5,-6,-2,-6,-4],
			[7,366,350,-311,-319,-10,-9,-7,-5,-6,-3],
			[8,366,359,-313,-323,-10,-10,-8,-6,-7,-4],
			[9,363,365,-312,-322,-11,-12,-7,-7,-8,-7],
			[10,359,370,-311,-321,-10,-13,-8,-10],
			[11,354,373,-310,-319,-9,-12,-8,-12],
			[12,348,373,-309,-314,-7,-11,-8,-13],
			[13,338,371,-305,-309,-7,-9,-6,-9],
			[14,331,368,-308,-308,-5,-3,-3,-4,-4,-6],
			[15,319,360,-310,-304,-1,2,-4,3,-4,-5,-5,0],
			[16,311,355,-312,-308,-2,6,-3,1,-4,4,-5,3,-2,-3,0,-8],
			[17,301,347,-313,-312,-3,5,-3,-2,-2,3,-3,1,1,-7,-1,-2,0,-1,1,-4,0,-1,-3,0,2,-2],
			[18,296,342,-314,-314,-2,1,-2,-1,-2,-2,-4,2,7,-8,-2,0,2,-1,4,-5,-1,0,-5,4,3,-3],
			[19,292,337,-314,-314,-1,-1,-1,-2,0,0,-4,0,7,-6,0,0,1,0,4,-4,0,0,-3,1,0,0],
			[20,288,333,-313,-316,-1,-1,1,-2,1,-1,-4,1,8,-4,1,-2,-1,0,4,-2,1,-1,0,0,0,1],
			[21,284,327,-313,-316,2,-3,0,0,0,-2,2,-1,4,-1,3,-1,0,0,3,-1,2,0,0,-1],
			[22,280,321,-312,-319,2,-1,1,-2,2,0,3,-1,3,-1,3,0,2,0,1,0],
			[23,276,315,-309,-319,1,-2,3,0,1,-2,4,1,3,0,4,2,2,0],
			[24,274,309,-310,-320,5,-1,0,-1,3,0,5,1,1,2,8,2],
			[25,273,304,-310,-321,6,1,0,-3,3,2,7,3,-1,-1,9,6],
			[26,272,299,-308,-320,6,0,0,-1,5,2,4,1,1,2],
			[27,273,295,-307,-320,5,2,1,-1,6,4,1,1,2,1],
			[28,275,291,-307,-317,5,2,0,-1,6,4,2,2,1,1,3,2],
			[29,278,288,-307,-316,4,2,1,1,5,5,1,1,2,0,3,3,1,2],
			[30,282,284,-308,-312,3,2,0,1,6,4,1,3,2,0,1,2,2,1,1,1],
			[31,286,282,-306,-311,1,3,2,1,3,4,2,3,2,2,2,1,2,2,0,0,3,5,0,0,1,1],
			[32,291,280,-306,-308,1,2,2,4,1,2,2,2,1,2,3,3,0,2,1,-1,1,4,0,1,0,-2,1,3,0,0],
			[33,296,281,-306,-309,0,5,3,2,0,2,1,2,1,3,1,0,0,2,0,1,2,3,0,0,-1,0,1,1,1,1,-1,-2],
			[34,302,283,-308,-309,0,4,2,2,-1,2,2,2,0,1,0,1,0,3,1,0,0,3,1,-1,-1,1,0,0,1,2,-1,-2],
			[35,309,286,-310,-310,1,4,-1,1,0,2,0,2,0,0,0,1,0,2,0,2,0,1,0,1,1,-1,-1,1,0,0,0,1],
			[36,316,290,-311,-311,-1,1,-1,3,0,1,-1,1,0,2,0,1,0,-1,-1,0,0,5,0,0,0,-1,-1,1,1,-1],
			[37,323,295,-312,-313,-1,1,-1,1,-1,2,-1,0,0,2,-1,0,0,0,0,0,-2,3,0,0,0,2],
			[38,331,301,-313,-315,0,0,-2,1,-3,2,1,-2,-1,2,-2,0,1,-1,-1,1,-2,2],
			[39,337,306,-313,-316,0,0,-2,-1,-3,1,0,-1,-1,1,-1,-1,0,0,-1,-1]
		],
		[
			[0,333,313,-307,-317,0,-1,0,-1,-4,0,3,-2,-6,2,3,-2,-2,0,1,0],
			[1,336,316,-306,-317,0,-1,-1,-1,-1,-1,1,-2,-6,1,2,-2,-1,-1,0,0],
			[2,339,319,-304,-316,-1,-1,-1,-2,1,-1,-2,-3,-5,1,3,-3,-2,0,-6,-1],
			[3,343,323,-305,-317,-1,0,1,-2,-1,-3,-2,-2,-4,-1,0,-2,-5,-1,-3,-1],
			[4,347,328,-306,-316,1,-2,-1,-2,-1,-3,-3,-2,-8,-3,-2,0,-1,-2],
			[5,351,334,-309,-319,2,0,-1,-3,-5,-4,-8,-1,-5,-3,-5,0],
			[6,353,340,-309,-319,1,-1,-4,-5,-8,-5,-7,-2,-4,-2],
			[7,354,345,-309,-319,0,-2,-7,-5,-9,-5,-6,-4,-6,-3],
			[8,355,351,-310,-318,-2,-4,-9,-8,-9,-6,-6,-4],
			[9,353,357,-309,-319,-3,-4,-10,-11,-9,-7,-5,-3],
			[10,350,362,-308,-318,-4,-6,-10,-13,-8,-6,-5,-5],
			[11,347,364,-309,-316,-3,-5,-10,-13,-7,-9,-4,-6],
			[12,342,365,-308,-314,-3,-5,-7,-11,-8,-11,-4,-6],
			[13,335,364,-308,-314,-1,1,-5,-9,-8,-12,-2,-7],
			[14,329,361,-310,-312,-1,2,-2,-3,-5,-8,-3,-9],
			[15,319,356,-311,-313,0,6,-2,1,-2,1,-4,-5,-2,-7],
			[16,311,351,-311,-314,0,5,-3,4,-2,2,-4,3,-1,-5,-4,3,-1,-1],
			[17,303,345,-312,-316,-1,2,-3,2,-1,0,-4,3,0,-2,-2,1,-3,-1,3,-5,0,-1,1,-3,-1,-1,0,-1],
			[18,298,339,-312,-315,-1,-1,-3,2,0,-3,-5,3,4,-6,-2,2,0,-2,4,-4,-1,-1,-1,3,2,-4,0,1],
			[19,295,336,-312,-317,-1,-2,-2,3,0,-4,-4,3,6,-4,-3,-1,1,1,4,-4,0,0,-1,0,2,-2,1,0],
			[20,291,331,-311,-316,1,-2,-3,1,2,-2,-5,2,7,-4,-2,0,1,0,3,-3,0,0,1,-1,3,-1,0,0],
			[21,288,327,-310,-317,1,-2,-3,1,1,-2,-1,-1,6,-2,-3,0,3,0,2,-2,1,0,3,0],
			[22,284,321,-309,-317,2,-2,-3,-1,1,-1,1,0,8,0,-5,-2,2,0,4,1,3,-1],
			[23,281,316,-307,-317,0,-1,0,-3,1,0,1,0,6,0,-1,0,0,0],
			[24,280,311,-309,-318,1,-2,2,0,1,-1,2,0,5,2,-2,-1],
			[25,279,307,-309,-319,2,-1,2,0,1,-1,1,0,6,2,-1,0],
			[26,279,303,-309,-318,3,-3,1,0,3,1,1,-1,3,3,0,-1],
			[27,280,300,-309,-319,3,-1,2,1,2,0,1,0,3,3,1,-1],
			[28,282,297,-309,-318,2,0,2,0,2,2,2,0,1,3,2,-1,3,5],
			[29,285,294,-310,-316,2,-1,2,2,2,1,1,1,3,3,1,-1,0,2],
			[30,288,292,-310,-315,1,-1,2,3,1,1,2,2,1,1,2,0,1,2],
			[31,292,291,-310,-315,0,-1,4,3,1,4,0,-1,1,2,3,2,0,1,2,1],
			[32,296,291,-310,-316,1,0,1,5,3,2,-1,1,2,1,0,2,3,2,0,1,1,1],
			[33,300,291,-310,-315,1,1,1,3,2,4,0,-1,1,3,1,1,0,2,0,0,0,1,1,0,1,2],
			[34,305,293,-311,-316,0,2,2,2,0,3,0,0,1,3,-1,0,2,1,-1,2,1,0,0,0,1,2,-1,0],
			[35,310,296,-310,-317,-1,2,1,1,-1,3,0,0,1,2,-1,1,0,0,0,2,1,-1,-1,3,0,-1,1,1,-1,0],
			[36,315,299,-310,-317,-1,0,0,1,-1,4,0,-1,-1,2,0,0,0,1,0,1,0,0,-1,2,1,-2,-1,3,0,-1],
			[37,320,302,-310,-317,0,0,-1,0,-2,3,1,0,-2,0,0,2,0,0,-1,0,0,0,0,3,-1,-2],
			[38,326,307,-310,-319,1,1,-1,0,-3,1,1,-1,-2,2,0,-1,-1,1,0,0,-1,1,0,-1],
			[39,330,310,-308,-318,-1,0,-1,-1,-2,1,1,-1,-4,1,2,-1,-3,0,2,0,-4,1]
		],
		[
			[0,329,314,-307,-317,1,-1,-4,1,3,-2,-1,0,-2,-1,4,-1,-5,1],
			[1,332,317,-307,-318,1,1,-2,-2,1,0,0,-2,-3,0,3,-2,-3,1],
			[2,334,319,-305,-316,0,-1,-2,-1,2,-1,-1,-2,-2,0,2,-1,-3,-1],
			[3,338,323,-307,-317,0,-1,1,-1,2,-1,-4,-1,1,-2,-2,-1,-2,-1],
			[4,342,327,-307,-316,-2,-2,2,-1,1,-1,-2,-2,-2,-2,-5,-2,0,0],
			[5,345,332,-309,-317,1,-2,-2,-2,1,-1,-3,-2,-6,-2,-6,-2,-3,-1],
			[6,347,337,-310,-318,2,0,-3,-4,-3,-3,-5,-2,-6,-3,-4,-2,-6,-2],
			[7,349,342,-312,-319,1,0,-2,-5,-6,-2,-5,-5,-8,-3,-2,-1],
			[8,349,348,-312,-319,1,-3,-5,-4,-6,-5,-6,-5,-6,-4],
			[9,348,354,-312,-321,0,-2,-4,-7,-8,-5,-7,-7,-4,-2],
			[10,346,358,-313,-320,2,-3,-6,-7,-8,-8,-7,-7,-1,-1],
			[11,343,360,-311,-320,-1,0,-5,-8,-7,-10,-6,-7,-2,-2],
			[12,340,361,-312,-319,0,0,-4,-6,-7,-10,-5,-9,-2,-2],
			[13,334,361,-311,-318,0,0,-2,-1,-6,-12,-4,-8,-3,-4],
			[14,329,359,-312,-317,-1,1,-1,1,-3,-6,-3,-8,-3,-7],
			[15,319,355,-310,-318,-2,3,0,5,-3,-2,-1,-3,-2,-1,-1,-10],
			[16,311,350,-310,-318,0,4,-2,2,-2,1,-2,2,-3,3,-1,-4,-2,2,0,-4],
			[17,304,344,-311,-318,-1,0,-1,2,-2,1,-1,-1,-2,4,-1,-2,-3,1,0,-1,0,-2,-2,1,0,-3,1,-1],
			[18,299,338,-311,-316,0,-2,-2,-1,0,0,-4,2,2,-3,-1,0,0,-1,-1,0,0,-1,0,0,1,-1,0,-1],
			[19,296,334,-311,-316,0,-3,0,1,-1,-1,-2,1,1,-2,0,-1,-1,1,2,-1,0,-1,-1,-1,2,0,0,0],
			[20,293,330,-311,-316,2,-2,-1,0,0,0,-2,-1,3,0,-2,-2,1,1,0,-1,2,-1,-1,0,3,-2],
			[21,290,327,-310,-317,3,-2,-3,-1,2,-1,-2,1,3,-2,-1,0,1,-1,1,0,1,-1],
			[22,287,322,-309,-318,1,-1,1,-1,0,0,0,-1,2,-1,1,1,1,-1,0,-1],
			[23,285,317,-310,-317,3,-1,1,-1,0,-1,1,0,3,0,-1,0,2,-1],
			[24,284,313,-310,-318,2,-1,2,-1,1,0,0,-1,3,1,0,-1,2,1],
			[25,284,310,-311,-319,1,-2,3,0,3,0,-2,-1,4,2,-1,-1],
			[26,284,306,-310,-318,0,-3,3,0,2,0,2,0,0,0,0,1],
			[27,285,304,-310,-320,0,-1,3,0,2,0,0,0,3,1,-1,0],
			[28,287,301,-310,-318,-1,-2,3,1,2,1,-1,-2,3,3,-1,-1],
			[29,290,299,-312,-318,1,-1,1,1,3,1,-2,-1,3,2],
			[30,292,298,-311,-318,-1,-2,3,3,1,1,-1,-1,1,1],
			[31,296,296,-312,-317,0,-1,3,4,0,0,-1,-1,2,1],
			[32,299,296,-312,-317,1,-1,2,4,0,1,0,-1,1,2,1,-1],
			[33,302,296,-311,-316,0,-1,2,3,0,1,2,2,-1,1,2,0,-1,3],
			[34,305,297,-310,-316,0,0,1,2,-1,1,2,2,-1,0,1,1,0,2,0,-1],
			[35,311,299,-311,-315,-1,-2,1,3,-1,0,1,2,-1,1,1,0,0,1,-1,-1,0,1,1,2],
			[36,315,302,-312,-317,2,0,-2,1,0,1,0,1,0,-1,-1,3,0,0,0,-2,0,3,-1,0,1,-1],
			[37,319,305,-311,-317,1,-1,-1,2,-1,0,0,-1,0,2,0,-1,-2,2,1,-1,-1,2,0,-1],
			[38,323,309,-309,-318,1,-1,-2,2,-1,0,1,-1,-1,-1,0,2,-1,-1,1,-1,-4,4],
			[39,326,311,-308,-316,2,-2,-5,1,2,-1,0,-1,-1,1,0,-2,-3,2,3,-2]
		],
		[
			[0,326,315,-307,-317,1,-1,0,0,-1,-1,3,-1,-2,0,-1,0],
			[1,328,317,-306,-317,1,0,0,-1,-1,-1,4,0,-4,-2,1,0],
			[2,331,319,-307,-316,2,-1,0,0,-1,-2,3,-1,-3,0],
			[3,334,322,-307,-316,1,0,3,-2,-4,-1,4,0,-3,-2,0,-1],
			[4,336,325,-305,-314,0,-2,2,-1,-4,-1,4,-1,-3,-2,-1,-1],
			[5,339,330,-306,-316,0,-1,-1,-2,-2,-2,3,0,-3,-1,-8,-3,-4,-2,-6,0],
			[6,342,335,-309,-317,1,-1,-3,-3,0,-1,-1,-2,-6,-2,-5,-3,-7,-2,-2,-1],
			[7,344,340,-311,-319,1,0,-3,-3,-3,-3,-1,-2,-7,-3,-5,-3,-5,-3],
			[8,344,345,-310,-318,-2,-3,-2,-4,-3,-2,-4,-4,-6,-4,-5,-3,-3,-2],
			[9,344,351,-312,-322,-1,-2,-3,-3,-2,-3,-6,-6,-6,-5,-4,-3],
			[10,342,354,-312,-319,-1,-4,-3,-5,-2,-2,-7,-8,-6,-5,-2,-3],
			[11,340,356,-312,-319,-2,-4,-2,-2,-2,-5,-7,-9,-5,-4,-2,-4],
			[12,337,357,-312,-319,-1,-2,-1,-3,-3,-3,-7,-11,-3,-4,-4,-5],
			[13,333,357,-313,-319,0,-1,-1,-1,-2,-1,-5,-11,-2,-5,-4,-7],
			[14,328,356,-312,-319,-2,-1,0,2,-1,0,-3,-6,-2,-7,-3,-9],
			[15,319,352,-311,-319,-1,1,0,3,-2,2,-1,-1,-1,-1,-1,-7,-1,-6],
			[16,312,347,-311,-318,0,1,-1,3,-2,1,-1,2,-1,1,-3,1,0,-3,-2,2,0,-4],
			[17,305,341,-311,-318,0,0,-1,3,-1,1,-3,0,1,-1,-2,1,0,0,-3,0,0,1,0,-3,-4,3],
			[18,300,337,-310,-319,0,-1,-1,1,-3,1,1,-1,-3,0,1,-1,1,-2,-2,1,1,-2,1,-1,2,-2],
			[19,297,333,-309,-318,0,-1,-1,0,-2,1,0,0,-1,-1,0,-1,2,-1,-1,0,0,-1,3,-1,0,-2],
			[20,295,330,-310,-318,1,-1,-1,0,-1,0,1,-1,-2,1,2,-2,0,0,1,-1,-2,1,4,-2],
			[21,293,327,-310,-319,2,0,-2,0,-1,-1,2,-1,-1,-1,3,0,-2,0,2,-1,-2,0],
			[22,290,323,-309,-319,2,-1,-2,1,0,-2,3,0,0,-1,0,0,0,0,2,-1],
			[23,288,318,-309,-317,3,-1,-2,-1,0,0,2,-1,2,0,-1,-1,2,1],
			[24,287,314,-310,-317,4,-1,-2,-2,1,1,0,-2,3,1,-1,0],
			[25,287,311,-311,-318,3,-1,0,-1,-1,0,3,-2,1,2,0,-2],
			[26,288,308,-313,-319,3,-1,1,0,0,-3,0,0,5,3],
			[27,289,306,-313,-319,3,-1,0,-2,0,0,1,-1],
			[28,291,304,-313,-319,1,-1,1,-1,0,-1,0,0],
			[29,293,303,-313,-321,1,1,0,-1,0,-1],
			[30,295,301,-313,-319,1,-1,0,1,-1,-1],
			[31,298,300,-313,-319,1,-1,0,1,0,-1],
			[32,301,300,-313,-320,1,1,0,1,0,-1,2,1],
			[33,303,300,-311,-319,0,1,1,1,0,0,0,1],
			[34,306,301,-311,-319,0,1,1,1,-1,0,1,2,1,1],
			[35,311,304,-311,-320,0,1,0,0,0,1,-1,2,1,-1,0,1,-1,1],
			[36,314,305,-310,-318,0,0,0,-1,-1,2,-1,1,1,0,0,-1,-1,2,0,0,0,-1],
			[37,317,308,-309,-319,1,-1,-1,2,-1,0,0,0,-1,0,1,-1,-1,1,0,0],
			[38,321,310,-309,-317,2,-1,-1,0,-2,1,2,-2,-1,1,0,-1,-1,1],
			[39,323,313,-307,-318,1,-1,-1,0,-1,1,2,-3,-1,1,-1,0]
		],
		[
			[0,322,315,-303,-316,0,-2,1,0,-2,0],
			[1,324,317,-302,-316,-1,-1,2,-1,0,0],
			[2,325,319,-299,-316,-3,0,3,-2,-1,0],
			[3,328,321,-300,-314,-1,-1,2,-1,-2,-2],
			[4,330,324,-298,-313,-3,-2,1,0,-2,-3],
			[5,333,328,-299,-313,-5,-3,3,-1,-5,-1,3,-1],
			[6,337,333,-305,-315,-2,-3,2,1,-5,-4,0,-1,-3,-1],
			[7,340,338,-310,-317,0,-3,1,0,-5,-3,-1,-2,-5,-2,-2,-3,-6,-2,-5,-2],
			[8,341,343,-312,-319,0,-1,0,-3,-4,-3,-3,-3,-3,-2,-5,-4,-4,-2,-3,-2],
			[9,341,348,-314,-321,2,-1,-3,-4,-2,-3,-3,-2,-5,-5,-4,-3,-5,-3,-1,-2],
			[10,339,352,-313,-321,0,-2,-1,-3,-3,-4,-4,-3,-4,-6,-5,-4,-3,-3],
			[11,338,354,-314,-322,0,0,-1,-3,-4,-5,-1,-3,-7,-7,-2,-4,-4,-4],
			[12,336,355,-314,-322,0,1,-1,-4,-3,-3,-3,-4,-4,-7,-3,-4,-4,-5],
			[13,333,356,-316,-323,2,1,-2,-2,-1,0,-3,-6,-2,-5,-4,-7,-3,-6],
			[14,328,354,-313,-321,-1,1,-1,-1,-1,1,-2,-2,-1,-5,-4,-10,-1,-2,-1,-8],
			[15,319,350,-311,-319,-1,1,0,0,-2,2,0,1,-1,0,-2,-4,0,-5,-2,-8],
			[16,312,346,-310,-319,-1,1,-1,-1,-1,5,-1,1,-1,-1,-2,1,0,1,-2,0,0,-4,0,-2],
			[17,305,340,-309,-319,-2,3,1,-2,-2,1,-2,2,1,-2,-2,3,-1,1,0,-2,-1,-1,-1,-1],
			[18,301,336,-310,-320,-1,2,0,-1,-1,-1,-1,0,0,0,-1,-1,-1,0,0,1,0,-3],
			[19,298,333,-309,-320,-1,2,1,-3,-1,2,-2,-1,1,0,0,-1,-1,0,1,0],
			[20,296,329,-309,-318,-1,0,1,-1,0,0,-2,0,2,-1,-1,0,0,1,0,-3],
			[21,294,327,-309,-319,1,0,-1,-1,0,0,0,-1,1,-1,0,0,-2,0],
			[22,292,323,-309,-318,1,-1,-1,-1,1,0,0,0,2,-1,-1,0],
			[23,290,318,-308,-316,-1,-2,1,0,1,0,0,-1,3,0,-1,0],
			[24,289,315,-309,-317,0,-1,1,-1,1,1,0,-2,3,1],
			[25,290,312,-313,-317,2,-2,1,-1,1,0,0,-1],
			[26,291,310,-315,-320,3,-1,-1,-2],
			[27,292,308,-315,-320,1,-2,0,-1],
			[28,294,306,-316,-321,1,0,-1,-2],
			[29,296,305,-316,-322,0,0],
			[30,297,304,-314,-322,-2,-1],
			[31,300,303,-314,-321,-2,-2],
			[32,303,304,-315,-323,0,-1,1,-1],
			[33,305,304,-314,-323,1,1,0,0],
			[34,307,305,-313,-323,1,1,0,0,1,2],
			[35,311,307,-311,-322,0,2,1,-3,-1,3,0,0],
			[36,313,308,-308,-320,-2,-1,1,0,-1,1,0,1,0,-1],
			[37,315,310,-306,-320,0,0,-1,-1,-1,2,0,-2,0,2],
			[38,318,312,-305,-319,0,0,0,-1,-1,1,1,-2],
			[39,320,314,-304,-319,0,0,0,-1,-1,1,2,-2]
		],
		[
			[0,321,316,-302,-318,0,0],
			[1,321,317,-297,-316,-2,-1],
			[2,324,319,-298,-315,-3,-1],
			[3,326,321,-297,-314,-3,0],
			[4,328,323,-296,-311,-4,-3],
			[5,332,327,-300,-312,-3,-2],
			[6,335,333,-303,-315,-4,-3],
			[7,338,338,-308,-317,-3,-4,0,0],
			[8,339,343,-310,-319,-3,-3,0,-2],
			[9,339,347,-312,-320,-2,-4,-1,-1,-2,-4,-2,-2],
			[10,338,350,-314,-320,0,-3,-2,-2,-2,-4,-2,-2,-4,-4,-3,-4,-4,-4,-2,-3],
			[11,337,353,-315,-323,0,-1,-1,-2,-3,-4,-1,-2,-4,-5,-3,-5,-4,-2],
			[12,335,354,-314,-323,-1,0,0,-2,-4,-5,-1,-1,-3,-5,-3,-5,-3,-4],
			[13,332,354,-314,-321,-1,-2,-1,0,-2,-4,0,0,-4,-6,-2,-7,-2,-1],
			[14,328,353,-312,-320,-3,-1,0,0,-2,-3,-1,0,-2,-4,-1,-4,-2,-5],
			[15,320,350,-313,-321,1,3,-2,-1,0,1,-1,-2,-2,0,0,1,-1,-4],
			[16,312,345,-310,-319,-1,4,0,-5,-1,5,-2,-3,0,3,-2,1,-1,0],
			[17,306,340,-310,-319,-1,3,-1,-4,0,3,0,-2,-2,3,0,0],
			[18,302,336,-311,-320,-1,2,1,-3,-1,0,-1,1],
			[19,299,332,-310,-318,-1,1,1,-2,1,-1,-3,1],
			[20,297,329,-310,-318,-1,0,1,0,2,-3,-2,2],
			[21,295,327,-309,-319,-2,0,2,0,1,-2],
			[22,293,323,-309,-317,-1,-1,1,-1,2,-1],
			[23,291,319,-309,-317,-1,-1,1,0,4,-1],
			[24,291,316,-312,-318,1,0],
			[25,291,313,-314,-319],
			[26,292,310,-316,-319],
			[27,294,309,-319,-322],
			[28,295,308,-319,-324],
			[29,298,306],
			[30,299,306],
			[31,302,305],
			[32,304,305,-317,-325],
			[33,305,305,-314,-323],
			[34,307,306,-314,-325],
			[35,311,308,-310,-323,-1,1],
			[36,313,309,-308,-321,-1,0],
			[37,315,311,-307,-321,1,0],
			[38,317,313,-304,-320,0,0],
			[39,319,314,-303,-318,0,-1]
		]
	];


	_initTable();

	/**
	 *
	 * This class converts the PCCS color system.
	 * Colors where h is -1 are handled especially as an achromatic color (n).
	 * Reference: KOBAYASHI Mituo and YOSIKI Kayoko,
	 * Mathematical Relation among PCCS Tones, PCCS Color Attributes and Munsell Color Attributes,
	 * Journal of the Color Science Association of Japan 25(4), 249-261, 2001.
	 *
	 * @author Takuto Yanagida
	 * @version 2020-12-08
	 *
	 */


	class PCCS {


		// Calculation of PCCS value (accurate) ------------------------------------


		static _calcPccsH(H) {
			let h1 = -1, h2 = -1;
			for (let i = 1; i < PCCS._MUNSELL_H.length; ++i) {
				if (PCCS._MUNSELL_H[i] <= H) h1 = i;
				if (H < PCCS._MUNSELL_H[i]) {
					h2 = i;
					break;
				}
			}
			if (h1 == -1) console.error("h1 is -1, H = " + H);
			if (h2 == -1) console.error("h2 is -1, H = " + H);
			return h1 + (h2 - h1) * (H - PCCS._MUNSELL_H[h1]) / (PCCS._MUNSELL_H[h2] - PCCS._MUNSELL_H[h1]);
		}

		static _calcPccsS(V, C, h) {
			const a = PCCS._calcInterpolatedCoefficients(h);
			const g = 0.81 - 0.24 * Math.sin((h - 2.6) / 12 * Math.PI);
			const a0 = -C / (1 - Math.exp(-g * V));
			return PCCS._solveEquation(PCCS._simplyCalcPccsS(V, C, h), a[3], a[2], a[1], a0);
		}

		static _calcInterpolatedCoefficients(h) {
			if (PCCS._MAX_HUE < h) h -= PCCS._MAX_HUE;
			let hf = 0 | Math.floor(h);
			if (hf % 2 != 0) --hf;
			let hc = hf + 2;
			if (PCCS._MAX_HUE < hc) hc -= PCCS._MAX_HUE;

			const af = PCCS._COEFFICIENTS[hf / 2], ac = PCCS._COEFFICIENTS[hc / 2], a = [0, 0, 0, 0];
			for (let i = 0; i < 3; ++i) {
				a[i + 1] = (h - hf) / (hc - hf) * (ac[i]- af[i]) + af[i];
			}
			return a;
		}

		static _solveEquation(x0, a3, a2, a1, a0) {
			let x = x0;
			while (true) {
				const y = a3 * x * x * x + a2 * x * x + a1 * x + a0;
				const yp = 3 * a3 * x * x + 2 * a2 * x + a1;
				const x1 = -y / yp + x;
				if (Math.abs(x1 - x) < 0.001) break;
				x = x1;
			}
			return x;
		}


		// Calculation of Munsell value (accurate) ---------------------------------


		static _calcMunsellH(h) {
			const h1 = 0 | Math.floor(h), h2 = h1 + 1;
			let H1 = PCCS._MUNSELL_H[h1], H2 = PCCS._MUNSELL_H[h2];
			if (H1 > H2) H2 = 100;
			return H1 + (H2 - H1) * (h - h1) / (h2 - h1);
		}

		static _calcMunsellC(h, l, s) {
			const a = PCCS._calcInterpolatedCoefficients(h);
			const g = 0.81 - 0.24 * Math.sin((h - 2.6) / 12 * Math.PI);
			return (a[3] * s * s * s + a[2] * s * s + a[1] * s) * (1 - Math.exp(-g * l));
		}


		// Calculation of PCCS value (concise) -------------------------------------


		static _simplyCalcPccsH(H) {
			const y = H * Math.PI / 50;
			return 24 * y / (2 * Math.PI) + 1.24
					+ 0.02 * Math.cos(y) - 0.1 * Math.cos(2 * y) - 0.11  * Math.cos(3 * y)
					+ 0.68 * Math.sin(y) - 0.3 * Math.sin(2 * y) + 0.013 * Math.sin(3 * y);
		}

		static _simplyCalcPccsS(V, C, h) {
			const Ct = 12 + 1.7 * Math.sin((h + 2.2) * Math.PI / 12);
			const gt = 0.81 - 0.24 * Math.sin((h - 2.6) * Math.PI / 12);
			const e2 = 0.004, e1 = 0.077, e0 = -C / (Ct * (1 - Math.exp(-gt * V)));
			return (-e1 + Math.sqrt(e1 * e1 - 4 * e2 * e0)) / (2 * e2);
		}


		// Calculation of Munsell value (concise) ----------------------------------


		static _simplyCalcMunsellH(h) {
			const x = (h - 1) * Math.PI / 12;
			return 100 * x / (2 * Math.PI) - 1
					+ 0.12 * Math.cos(x) + 0.34 * Math.cos(2 * x) + 0.4 * Math.cos(3 * x)
					- 2.7  * Math.sin(x) + 1.5  * Math.sin(2 * x) - 0.4 * Math.sin(3 * x);
		}

		static _simplyCalcMunsellC(h, l, s) {
			const Ct = 12 + 1.7 * Math.sin((h + 2.2) * Math.PI / 12);
			const gt = 0.81 - 0.24 * Math.sin((h - 2.6) * Math.PI / 12);
			return Ct * (0.077 * s + 0.0040 * s * s) * (1 - Math.exp(-gt * l));
		}

		/**
		 * Convert Munsell (HVC) to PCCS (hls).
		 * @param {number[]} hvc Hue, value, chroma of Munsell color
		 * @return {number[]} PCCS color
		 */
		static fromMunsell([H, V, C]) {
			if (Munsell.MAX_HUE <= H) H -= Munsell.MAX_HUE;
			let h = 0, l = V, s = 0;

			h = PCCS.conversionMethod._calcPccsH(H);
			if (Munsell.MONO_LIMIT_C <= C) {
				s = PCCS.conversionMethod._calcPccsS(V, C, h);
			}
			if (PCCS._MAX_HUE <= h) h -= PCCS._MAX_HUE;
			return [h, l, s];
		}

		/**
		 * Convert PCCS (hls) to Munsell (HVC).
		 * @param {number[]} hls Hue, lightness, saturation of PCCS color
		 * @return {number[]} Munsell color
		 */
		static toMunsell([h, l, s]) {
			let H = 0, V = l, C = 0;

			H = PCCS.conversionMethod._calcMunsellH(h);
			if (PCCS._MONO_LIMIT_S <= s) {
				C = PCCS.conversionMethod._calcMunsellC(h, l, s);
			}
			if (H < 0) H += Munsell.MAX_HUE;
			if (Munsell.MAX_HUE <= H) H -= Munsell.MAX_HUE;
			return [H, V, C];
		}

		/**
		 * Calculate tone.
		 * @param {number[]} hls Hue, lightness, saturation of PCCS color
		 * @return {number} Tone
		 */
		static tone(hls) {
			const s = hls[2];
			const t = PCCS.relativeLightness(hls);
			const tu = s * -3 / 10 + 8.5, td = s * 3 / 10 + 2.5;

			if (s < 1) {
				return PCCS.Tone.none;
			} else if (1 <= s && s < 4) {
				if (t < td)  return PCCS.Tone.dkg;
				if (t < 5.5) return PCCS.Tone.g;
				if (t < tu)  return PCCS.Tone.ltg;
				if (s < 2.5) return PCCS.Tone.p;
				return PCCS.Tone.p_p;
			} else if (4 <= s && s < 7) {
				if (t < td)  return PCCS.Tone.dk;
				if (t < 5.5) return PCCS.Tone.d;
				if (t < tu)  return PCCS.Tone.sf;
				if (s < 5.5) return PCCS.Tone.lt;
				return PCCS.Tone.lt_p;
			} else if (7 <= s && s < 8.5) {
				if (t < td) return PCCS.Tone.dp;
				if (t < tu) return PCCS.Tone.s;
				return PCCS.Tone.b;
			} else {
				return PCCS.Tone.v;
			}
		}

		/**
		 * Return relative lightness (lightness in tone coordinate system).
		 * @param {number[]} hls Hue, lightness, saturation of PCCS color
		 * @return {number[]} Relative lightness L
		 */
		static relativeLightness([h, l, s]) {
			return l - (0.25 - 0.34 * Math.sqrt(1 - Math.sin((h - 2) * Math.PI / 12))) * s;
		}

		/**
		 * Return absolute lightness (lightness in PCCS).
		 * @param {number[]} hLs Tone coordinate color
		 * @return {number[]} Absolute lightness l
		 */
		static absoluteLightness([h, L, s]) {
			return L + (0.25 - 0.34 * Math.sqrt(1 - Math.sin((h - 2) * Math.PI / 12))) * s;
		}

		/**
		 * Convert PCCS color to tone coordinate color.
		 * @param {number[]} hls Hue, lightness, saturation of PCCS color
		 * @return {number[]} Tone coordinate color
		 */
		static toToneCoordinate(hls) {
			return [hls[0], relativeLightness(hls), hls[2]];
		}

		/**
		 * Convert tone coordinate color to PCCS color.
		 * @param {number[]} hLs Tone coordinate color
		 * @return {number[]} PCCS color
		 */
		static toNormalCoordinate(hLs) {
			return [hLs[0], absoluteLightness(hLs), hLs[2]];
		}

		/**
		 * Returns the string representation of PCCS numerical representation.
		 * @param {number[]} hls Hue, lightness, saturation of PCCS color
		 * @return {string} String representation
		 */
		static toString(hls) {
			const lstr = Math.round(hls[1] * 10) / 10;
			if (hls[2] < PCCS._MONO_LIMIT_S) {
				if (9.5 <= hls[1]) return `W N-${lstr}`;
				if (hls[1] <= 1.5) return `Bk N-${lstr}`;
				return `Gy-${lstr} N-${lstr}`;
			} else {
				const hstr = Math.round(hls[0] * 10) / 10;
				const sstr = Math.round(hls[2] * 10) / 10;

				let tn = Math.round(hls[0]);
				if (tn <= 0) tn = PCCS._MAX_HUE;
				if (PCCS._MAX_HUE < tn) tn -= PCCS._MAX_HUE;
				const hue = PCCS._HUE_NAMES[tn];
				const tone = PCCS._TONE_NAMES[PCCS.tone(hls)];

				if (tone == 'none') return `${hstr}:${hue}-${lstr}-${sstr}s`;
				return `${tone}${hstr} ${hstr}:${hue}-${lstr}-${sstr}s`;
			}
		}

		/**
		 * Returns the string representation of PCCS hues.
		 * @param {number[]} hls Hue, lightness, saturation of PCCS color
		 * @return {string} String representation of hues
		 */
		static toHueString([h, l, s]) {
			if (s < PCCS._MONO_LIMIT_S) {
				return 'N';
			} else {
				let tn = Math.round(h);
				if (tn <= 0) tn = PCCS._MAX_HUE;
				if (PCCS._MAX_HUE < tn) tn -= PCCS._MAX_HUE;
				return PCCS._HUE_NAMES[tn];
			}
		}

		/**
		 * Returns the string representation of PCCS tones.
		 * @param {number[]} hls Hue, lightness, saturation of PCCS color
		 * @return {string} String representation of tones
		 */
		static toToneString(hls) {
			if (hls[2] < PCCS._MONO_LIMIT_S) {
				if (9.5 <= hls[1]) return 'W';
				if (hls[1] <= 1.5) return 'Bk';
				return 'Gy';
			} else {
				return PCCS._TONE_NAMES[PCCS.tone(hls)];
			}
		}

	}

	// Hue [0, 24), 24 is also acceptable
	PCCS._MIN_HUE = 0;
	PCCS._MAX_HUE = 24;  // same as MIN_HUE
	PCCS._MONO_LIMIT_S = 0.01;
	PCCS._HUE_NAMES  = ['', 'pR', 'R', 'yR', 'rO', 'O', 'yO', 'rY', 'Y', 'gY', 'YG', 'yG', 'G', 'bG', 'GB', 'GB', 'gB', 'B', 'B', 'pB', 'V', 'bP', 'P', 'rP', 'RP'];
	PCCS._TONE_NAMES = ['p', 'p+', 'ltg', 'g', 'dkg', 'lt', 'lt+', 'sf', 'd', 'dk', 'b', 's', 'dp', 'v', 'none'];
	PCCS._MUNSELL_H = [
		96,  // Dummy
		0,  4,  7, 10, 14, 18, 22, 25, 28, 33, 38, 43,
		49, 55, 60, 65, 70, 73, 76, 79, 83, 87, 91, 96, 100
	];
	PCCS._COEFFICIENTS = [
		[0.853642,  0.084379, -0.002798],  // 0 == 24
		[1.042805,  0.046437,  0.001607],  // 2
		[1.079160,  0.025470,  0.003052],  // 4
		[1.039472,  0.054749, -0.000511],  // 6
		[0.925185,  0.050245,  0.000953],  // 8
		[0.968557,  0.012537,  0.003375],  // 10
		[1.070433, -0.047359,  0.007385],  // 12
		[1.087030, -0.051075,  0.006526],  // 14
		[1.089652, -0.050206,  0.006056],  // 16
		[0.880861,  0.060300, -0.001280],  // 18
		[0.897326,  0.053912, -0.000860],  // 20
		[0.887834,  0.055086, -0.000847],  // 22
		[0.853642,  0.084379, -0.002798],  // 24
	];

	/**
	 * Enum type for conversion methods.
	 */
	PCCS.ConversionMethod = Object.freeze({
		/**
		 * Concise conversion
		 */
		CONCISE: {
			_calcMunsellH: PCCS._simplyCalcMunsellH,
			_calcMunsellS: PCCS._simplyCalcMunsellC,
			_calcPccsH: PCCS._simplyCalcPccsH,
			_calcPccsS: PCCS._simplyCalcPccsS,
		},

		/**
		 * Accurate conversion
		 */
		ACCURATE: {
			_calcMunsellH: PCCS._calcMunsellH,
			_calcMunsellC: PCCS._calcMunsellC,
			_calcPccsH: PCCS._calcPccsH,
			_calcPccsS: PCCS._calcPccsS,
		}
	});

	/**
	 * Indicates the currently selected color vision characteristic conversion method.
	 */
	PCCS.conversionMethod = PCCS.ConversionMethod.ACCURATE;

	/**
	 * Enum type for Tone.
	 */
	PCCS.Tone = Object.freeze({
		p   : 0,
		p_p : 1,
		ltg : 2,
		g   : 3,
		dkg : 4,
		lt  : 5,
		lt_p: 6,
		sf  : 7,
		d   : 8,
		dk  : 9,
		b   : 10,
		s   : 11,
		dp  : 12,
		v   : 13,
		none: 14
	});

	/**
	 *
	 * Functions for Color Space Conversion
	 *
	 * @author Takuto Yanagida
	 * @version 2020-12-17
	 *
	 */


	/**
	 * Convert a color from one color space to another.
	 * @param {number[]} vs a color of the color space 'from'
	 * @param {string} from a color space name
	 * @param {string=} [to='rgb'] a color space name
	 * @return {number[]} a color of the color space 'to'
	 */
	function convert(vs, from, to = 'rgb') {
		const type = from.toLowerCase() + '-' + to.toLowerCase();
		switch (type) {
			case 'yiq-rgb'     : return RGB.fromLRGB(LRGB.fromYIQ(vs));
			case 'lrgb-rgb'    : return RGB.fromLRGB(vs);
			case 'xyz-rgb'     : return RGB.fromLRGB(LRGB.fromXYZ(vs));
			case 'yxy-rgb'     : return RGB.fromLRGB(LRGB.fromXYZ(XYZ.fromYxy(vs)));
			case 'lab-rgb'     : return RGB.fromLRGB(LRGB.fromXYZ(XYZ.fromLab(vs)));
			case 'lms-rgb'     : return RGB.fromLRGB(LRGB.fromXYZ(XYZ.fromLMS(vs)));
			case 'munsell-rgb' : return RGB.fromLRGB(LRGB.fromXYZ(XYZ.fromMunsell(vs)));
			case 'pccs-rgb'    : return RGB.fromLRGB(LRGB.fromXYZ(XYZ.fromMunsell(Munsell.fromPCCS(vs))));

			case 'rgb-lrgb'    : return LRGB.fromRGB(vs);
			case 'yiq-lrgb'    : return LRGB.fromYIQ(vs);
			case 'xyz-lrgb'    : return LRGB.fromXYZ(vs);
			case 'yxy-lrgb'    : return LRGB.fromXYZ(XYZ.fromYxy(vs));
			case 'lab-lrgb'    : return LRGB.fromXYZ(XYZ.fromLab(vs));
			case 'lms-lrgb'    : return LRGB.fromXYZ(XYZ.fromLMS(vs));
			case 'munsell-lrgb': return LRGB.fromXYZ(XYZ.fromMunsell(vs));
			case 'pccs-lrgb'   : return LRGB.fromXYZ(XYZ.fromMunsell(Munsell.fromPCCS(vs)));

			case 'rgb-yiq'     : return YIQ.fromLRGB(LRGB.fromRGB(vs));
			case 'lrgb-yiq'    : return YIQ.fromLRGB(vs);
			case 'xyz-yiq'     : return YIQ.fromLRGB(LRGB.fromXYZ(vs));
			case 'yxy-yiq'     : return YIQ.fromLRGB(LRGB.fromXYZ(XYZ.fromYxy(vs)));
			case 'lab-yiq'     : return YIQ.fromLRGB(LRGB.fromXYZ(XYZ.fromLab(vs)));
			case 'lms-yiq'     : return YIQ.fromLRGB(LRGB.fromXYZ(XYZ.fromLMS(vs)));
			case 'munsell-yiq' : return YIQ.fromLRGB(LRGB.fromXYZ(XYZ.fromMunsell(vs)));
			case 'pccs-yiq'    : return YIQ.fromLRGB(LRGB.fromXYZ(XYZ.fromMunsell(Munsell.fromPCCS(vs))));

			case 'rgb-xyz'     : return XYZ.fromLRGB(LRGB.fromRGB(vs));
			case 'yiq-xyz'     : return XYZ.fromLRGB(LRGB.fromYIQ(vs));
			case 'lrgb-xyz'    : return XYZ.fromLRGB(vs);
			case 'yxy-xyz'     : return XYZ.fromYxy(vs);
			case 'lab-xyz'     : return XYZ.fromLab(vs);
			case 'lms-xyz'     : return XYZ.fromLMS(vs);
			case 'munsell-xyz' : return XYZ.fromMunsell(vs);
			case 'pccs-xyz'    : return XYZ.fromMunsell(Munsell.fromPCCS(vs));

			case 'rgb-yxy'     : return Yxy.fromXYZ(XYZ.fromLRGB(LRGB.fromRGB(vs)));
			case 'yiq-yxy'     : return Yxy.fromXYZ(XYZ.fromLRGB(LRGB.fromYIQ(vs)));
			case 'lrgb-yxy'    : return Yxy.fromXYZ(XYZ.fromLRGB(vs));
			case 'xyz-yxy'     : return Yxy.fromXYZ(vs);
			case 'lab-yxy'     : return Yxy.fromXYZ(XYZ.fromLab(vs));
			case 'lms-yxy'     : return Yxy.fromXYZ(XYZ.fromLMS(vs));
			case 'munsell-yxy' : return Yxy.fromXYZ(XYZ.fromMunsell(vs));
			case 'pccs-yxy'    : return Yxy.fromXYZ(XYZ.fromMunsell(Munsell.fromPCCS(vs)));

			case 'rgb-lab'     : return Lab.fromXYZ(XYZ.fromLRGB(LRGB.fromRGB(vs)));
			case 'yiq-lab'     : return Lab.fromXYZ(XYZ.fromLRGB(LRGB.fromYIQ(vs)));
			case 'lrgb-lab'    : return Lab.fromXYZ(XYZ.fromLRGB(vs));
			case 'xyz-lab'     : return Lab.fromXYZ(vs);
			case 'yxy-lab'     : return Lab.fromXYZ(XYZ.fromYxy(vs));
			case 'lms-lab'     : return Lab.fromXYZ(XYZ.fromLMS(vs));
			case 'munsell-lab' : return Lab.fromXYZ(XYZ.fromMunsell(vs));
			case 'pccs-lab'    : return Lab.fromXYZ(XYZ.fromMunsell(Munsell.fromPCCS(vs)));

			case 'rgb-lms'     : return LMS.fromXYZ(XYZ.fromLRGB(LRGB.fromRGB(vs)));
			case 'yiq-lms'     : return LMS.fromXYZ(XYZ.fromLRGB(LRGB.fromYIQ(vs)));
			case 'lrgb-lms'    : return LMS.fromXYZ(XYZ.fromLRGB(vs));
			case 'xyz-lms'     : return LMS.fromXYZ(vs);
			case 'yxy-lms'     : return LMS.fromXYZ(XYZ.fromYxy(vs));
			case 'lab-lms'     : return LMS.fromXYZ(XYZ.fromLab(vs));
			case 'munsell-lms' : return LMS.fromXYZ(XYZ.fromMunsell(vs));
			case 'pccs-lms'    : return LMS.fromXYZ(XYZ.fromMunsell(Munsell.fromPCCS(vs)));

			case 'rgb-munsell' : return Munsell.fromXYZ(XYZ.fromLRGB(LRGB.fromRGB(vs)));
			case 'yiq-munsell' : return Munsell.fromXYZ(XYZ.fromLRGB(LRGB.fromYIQ(vs)));
			case 'lrgb-munsell': return Munsell.fromXYZ(XYZ.fromLRGB(vs));
			case 'xyz-munsell' : return Munsell.fromXYZ(vs);
			case 'yxy-munsell' : return Munsell.fromXYZ(XYZ.fromYxy(vs));
			case 'lab-munsell' : return Munsell.fromXYZ(XYZ.fromLab(vs));
			case 'lms-munsell' : return Munsell.fromXYZ(XYZ.fromLMS(vs));
			case 'pccs-munsell': return Munsell.fromPCCS(vs);

			case 'rgb-pccs'    : return PCCS.fromMunsell(Munsell.fromXYZ(XYZ.fromLRGB(LRGB.fromRGB(vs))));
			case 'yiq-pccs'    : return PCCS.fromMunsell(Munsell.fromXYZ(XYZ.fromLRGB(LRGB.fromYIQ(vs))));
			case 'lrgb-pccs'   : return PCCS.fromMunsell(Munsell.fromXYZ(XYZ.fromLRGB(vs)));
			case 'xyz-pccs'    : return PCCS.fromMunsell(Munsell.fromXYZ(vs));
			case 'yxy-pccs'    : return PCCS.fromMunsell(Munsell.fromXYZ(XYZ.fromYxy(vs)));
			case 'lab-pccs'    : return PCCS.fromMunsell(Munsell.fromXYZ(XYZ.fromLab(vs)));
			case 'lms-pccs'    : return PCCS.fromMunsell(Munsell.fromXYZ(XYZ.fromLMS(vs)));
			case 'munsell-pccs': return PCCS.fromMunsell(vs);
		}
		return vs;
	}

	function isRGBSaturated() {
		return RGB.isSaturated;
	}

	function isYxySaturated() {
		return Yxy.isSaturated;
	}

	function isMunsellSaturated() {
		return Munsell.isSaturated;
	}


	// ライブラリを作る --------------------------------------------------------


	return {
		convert,
		isRGBSaturated,
		isYxySaturated,
		isMunsellSaturated,

		RGB, LRGB, YIQ, XYZ, Yxy, Lab, LMS, Munsell, PCCS
	};

})();
