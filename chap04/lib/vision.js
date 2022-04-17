/**
 * 視覚ライブラリ（VISION）
 *
 * @author Takuto Yanagida
 * @version 2021-01-22
 */


/**
 * ライブラリ変数
 */
const VISION = (function () {

	'use strict';


	const COLOR_SPACE_NS = { XYZ: COLOR.XYZ, LMS: COLOR.LMS, LRGB: COLOR.LRGB };

	/**
	 *
	 * Evaluation Methods
	 *
	 * @author Takuto Yanagida
	 * @version 2020-12-16
	 *
	 */


	class Evaluation {


		// Calculation of the conspicuity degree -----------------------------------


		/**
		 * Calculate the conspicuity degree.
		 * Reference: Effective use of color conspicuity for Re-Coloring system,
		 * Correspondences on Human interface Vol. 12, No. 1, SIG-DE-01, 2010.
		 * @param {number[]} lab L*, a*, b* of CIELAB color
		 * @return {number} Conspicuity degree [0, 180]
		 * TODO Consider chroma (ab radius of LAB)
		 */
		static conspicuityOfLab([ls, as, bs]) {
			const rad = (bs > 0) ? Math.atan2(bs, as) : (Math.atan2(-bs, -as) + Math.PI);
			const H = rad / (Math.PI * 2) * 360;
			const a = 35;  // Constant
			if (H < a) return Math.abs(180 - (360 + H - a));
			else return Math.abs(180 - (H - a));
		}


		// Calculation of the color difference -------------------------------------


		/**
		 * Calculate distance of two vectors
		 * @param {number[]} vs1 vector 1
		 * @param {number[]} vs2 vector 2
		 * @return {number} Distance
		 */
		static distance([v11, v12, v13], [v21, v22, v23]) {
			return Math.sqrt((v11 - v21) * (v11 - v21) + (v12 - v22) * (v12 - v22) + (v13 - v23) * (v13 - v23));
		}

		/**
		 * Color difference calculation method by CIE 76
		 * @param {number[]} lab1 L*, a*, b* of CIELAB color 1
		 * @param {number[]} lab2 L*, a*, b* of CIELAB color 2
		 * @return {number} Color difference
		 */
		static CIE76([ls1, as1, bs1], [ls2, as2, bs2]) {
			return Math.sqrt((ls1 - ls2) * (ls1 - ls2) + (as1 - as2) * (as1 - as2) + (bs1 - bs2) * (bs1 - bs2));
		}

		/**
		* Color difference calculation method by CIEDE2000
		* Reference: http://www.ece.rochester.edu/~gsharma/ciede2000/ciede2000noteCRNA.pdf
		* http://d.hatena.ne.jp/yoneh/20071227/1198758604
		 * @param {number[]} lab1 L*, a*, b* of CIELAB color 1
		 * @param {number[]} lab2 L*, a*, b* of CIELAB color 2
		 * @return {number} Color difference
		*/
		static CIEDE2000([ls1, as1, bs1], [ls2, as2, bs2]) {
			const C1 = Math.sqrt(as1 * as1 + bs1 * bs1), C2 = Math.sqrt(as2 * as2 + bs2 * bs2);
			const Cb = (C1 + C2) / 2;
			const G = 0.5 * (1 - Math.sqrt(Math.pow(Cb, 7) / (Math.pow(Cb, 7) + Math.pow(25, 7))));
			const ap1 = (1 + G) * as1, ap2 = (1 + G) * as2;
			const Cp1 = Math.sqrt(ap1 * ap1 + bs1 * bs1), Cp2 = Math.sqrt(ap2 * ap2 + bs2 * bs2);
			const hp1 = (bs1 == 0 && ap1 == 0) ? 0 : atan(bs1, ap1), hp2 = (bs2 == 0 && ap2 == 0) ? 0 : atan(bs2, ap2);

			const DLp = ls2 - ls1;
			const DCp = Cp2 - Cp1;
			let Dhp = 0;
			if (Cp1 * Cp2 < 1e-10) {
				Dhp = 0;
			} else if (Math.abs(hp2 - hp1) <= 180) {
				Dhp = hp2 - hp1;
			} else if (hp2 - hp1 > 180) {
				Dhp = (hp2 - hp1) - 360;
			} else if (hp2 - hp1 < -180) {
				Dhp = (hp2 - hp1) + 360;
			}
			const DHp = 2 * Math.sqrt(Cp1 * Cp2) * sin(Dhp / 2);

			const Lbp = (ls1 + ls2) / 2;
			const Cbp = (Cp1 + Cp2) / 2;
			let hbp = 0;
			if (Cp1 * Cp2 < 1e-10) {
				hbp = hp1 + hp2;
			} else if (Math.abs(hp2 - hp1) <= 180) {
				hbp = (hp1 + hp2) / 2;
			} else if (Math.abs(hp2 - hp1) > 180 && hp1 + hp2 < 360) {
				hbp = (hp1 + hp2 + 360) / 2;
			} else if (Math.abs(hp2 - hp1) > 180 && hp1 + hp2 >= 360) {
				hbp = (hp1 + hp2 - 360) / 2;
			}
			const T = 1 - 0.17 * cos(hbp - 30) + 0.24 * cos(2 * hbp) + 0.32 * cos(3 * hbp + 6) - 0.2 * cos(4 * hbp - 63);
			const Dth = 30 * Math.exp(-sq((hbp - 275) / 25));
			const RC = 2 * Math.sqrt(Math.pow(Cbp, 7) / (Math.pow(Cbp, 7) + Math.pow(25, 7)));
			const SL = 1 + 0.015 * sq(Lbp - 50) / Math.sqrt(20 + sq(Lbp - 50));
			const SC = 1 + 0.045 * Cbp;
			const SH = 1 + 0.015 * Cbp * T;
			const RT = -sin(2 * Dth) * RC;

			const kL = 1, kC = 1, kH = 1;
			const DE = Math.sqrt(sq(DLp / (kL * SL)) + sq(DCp / (kC * SC)) + sq(DHp / (kH * SH)) + RT * (DCp / (kC * SC)) * (DHp / (kH * SH)));
			return DE;

			function sq(v) { return v * v; }
			function atan(y, x) { const v = Math.atan2(y, x) * 180 / Math.PI; return (v < 0) ? (v + 360) : v; }
			function sin(deg) { return Math.sin(deg * Math.PI / 180); }
			function cos(deg) { return Math.cos(deg * Math.PI / 180); }
		}

		/**
		 * Calculate the color difference between the two colors.
		 * @param {number[]} lab1 L*, a*, b* of CIELAB color 1
		 * @param {number[]} lab2 L*, a*, b* of CIELAB color 2
		 * @param {string} method Method of calculation
		 * @return {number} Color difference
		 */
		static differenceBetweenLab(lab1, lab2, method = 'cie76') {
			if (method === 'cie76') {
				return Evaluation.CIE76(lab1, lab2);
			} else {
				return Evaluation.CIEDE2000(lab1, lab2);
			}
		}


		// Determination of the basic categorical color ----------------------------


		/**
		 * Find the basic categorical color of the specified color.
		 * @param {number[]} yxy Yxy color
		 * @return {string} Basic categorical color
		 */
		static categoryOfYxy([y, sx, sy]) {
			const lum = Math.pow(y * Evaluation._Y_TO_LUM, 0.9);  // magic number

			let diff = Number.MAX_VALUE;
			let clum = 0;
			for (let l of Evaluation._LUM_TABLE) {
				const d = Math.abs(lum - l);
				if (d < diff) {
					diff = d;
					clum = l;
				}
			}
			const t = Evaluation._CC_TABLE[clum];
			sx *= 1000;
			sy *= 1000;
			let dis = Number.MAX_VALUE;
			let cc = 1;
			for (let i = 0; i < 18 * 21; i += 1) {
				if (t[i] === '.') continue;
				const x = (i % 18) * 25 + 150;
				const y = ((i / 18) | 0) * 25 + 75;
				const d = Math.sqrt((sx - x) * (sx - x) + (sy - y) * (sy - y));
				if (d < dis) {
					dis = d;
					cc = t[i];
				}
			}
			const ci = (cc === 'a') ? 10 : parseInt(cc);
			return Evaluation.CATEGORICAL_COLORS[ci];
		}

	}

	/**
	 * They are sensual expressions of color difference by NBS unit.
	 * The values represent the lower limit of each range.
	 */
	Evaluation.NBS_TRACE = 0.0;
	Evaluation.NBS_SLIGHT = 0.5;
	Evaluation.NBS_NOTICEABLE = 1.5;
	Evaluation.NBS_APPRECIABLE = 3.0;
	Evaluation.NBS_MUCH = 6.0;
	Evaluation.NBS_VERY_MUCH = 12.0;

	/**
	 * Dental Materials J. 27(1), 139-144 (2008)
	 */
	Evaluation.DE_TO_NBS = 0.92;

	/**
	 * Basic Categorical Colors
	 */
	Evaluation.CATEGORICAL_COLORS = [
		'white', 'black', 'red', 'green',
		'yellow', 'blue', 'brown', 'purple',
		'pink', 'orange', 'gray',
	];
	Evaluation._Y_TO_LUM = 60;
	Evaluation._LUM_TABLE = [2, 5, 10, 20, 30, 40];

	Evaluation._CC_TABLE = {
		 2: '...................5.................557................557...............55777.............55.777............55577777...........55577777..........5557777777........55511..6767.......333.116666666......3331.666666.......3333116666........33331116...........33333.............3333..............33...................................................................................',
		 5: '5..................55................557...............55777..............55777.............5577777...........555777777.........5557777777.........55a77777777.......555aa77777727.....555aaa66666666....3353aa666666666...33333a6666666......33333366666.......333333366.........33333333..........333333.............3333..............33................3..............................',
		10: '5..................57................557...............55777..............557777............5577777...........555777777.........55577777788.......555aa777..88.......555aa77...222.....555aa.68668.222...5333aa666666999...33333a66666699....3333333666666......3333333666........333333336.........3333333...........333333.............333...............33................3............',
		20: '.......................................77..............55777..............557777............557777............557777788.........55577778888.......555577.88888.......555.78888888......555aa.8888882.....5533.a888999999...33333366999999....3333333669999......33333334.99.......333333344.........33333333..........333333............33333..............33................3............',
		30: '..........................................................................5.77..............55777.............55777.............55577.8...........55557788...........55557888..........555508888.........3535348888........33333449999.......333333449999.......33333344449.......333333444.........33333334..........333333............33333..............333...............3............',
		40: '..............................................................................................77..............55577.............55577.............555578.............5550.8............5555088...........5333008...........35333449..........333333444..........333334444.........333333444.........33333344..........3333333...........33333..............333...............3............'
	};

	/**
	 *
	 * This class performs various simulations of color space.
	 *
	 * @author Takuto Yanagida
	 * @version 2020-12-08
	 *
	 */


	class AgeSimulation {

		/*
		 * Color vision age-related change simulation (conversion other than lightness)
		 * Reference: Katsunori Okajima, Human Color Vision Mechanism and its Age-Related Change,
		 * IEICE technical report 109(249), 43-48, 2009-10-15.
		 */

		static _hueDiff(a, b) {
			const p = (b > 0) ? Math.atan2(b, a) : (Math.atan2(-b, -a) + Math.PI);
			return 4.5 * Math.cos(2 * Math.PI * (p - 28.8) / 50.9) + 4.4;
		}

		static _chromaRatio(a, b) {
			const c = Math.sqrt(a * a + b * b);
			return 0.83 * Math.exp(-c / 13.3) - (1 / 8) * Math.exp(-(c - 50) * (c - 50) / (3000 * 3000)) + 1;
		}

		/**
		 * Convert CIELAB (L*a*b*) to CIELAB in the color vision of elderly people (70 years old) (conversion other than lightness).
		 * @param {number[]} lab L*, a*, b* of CIELAB color (young person)
		 * @return {number[]} CIELAB color in color vision of elderly people
		 */
		static labToElderlyAB([ls, as, bs]) {
			const h = ((bs > 0) ? Math.atan2(bs, as) : (Math.atan2(-bs, -as) + Math.PI)) + AgeSimulation._hueDiff(as, bs);
			const c = Math.sqrt(as * as + bs * bs) * AgeSimulation._chromaRatio(as, bs);
			return [
				ls,
				Math.cos(h) * c,
				Math.sin(h) * c,
			];
		}

		/**
		 * Convert CIELAB (L*a*b*) to CIELAB in the color vision of young people (20 years old) (conversion other than lightness).
		 * @param {number[]} lab L*, a*, b* of CIELAB color (elderly person)
		 * @return {number[]} CIELAB color in color vision of young people
		 */
		static labToYoungAB([ls, as, bs]) {
			const h = ((bs > 0) ? Math.atan2(bs, as) : (Math.atan2(-bs, -as) + Math.PI)) - AgeSimulation._hueDiff(as, bs);
			const c = Math.sqrt(as * as + bs * bs) / AgeSimulation._chromaRatio(as, bs);
			return [
				ls,
				Math.cos(h) * c,
				Math.sin(h) * c,
			];
		}

	}

	/**
	 *
	 * This class simulates color vision characteristics.
	 *
	 * @author Takuto Yanagida
	 * @version 2020-12-08
	 *
	 */


	class ColorVisionSimulation {

		/*
		 * Reference: Brettel, H.; Viénot, F. & Mollon, J. D.,
		 * Computerized simulation of color appearance for dichromats,
		 * Journal of the Optical Society of America A, 1997, 14, 2647-2655.
		 */

		/**
		 * Simulate protanopia
		 * @param {number[]} lms LMS color
		 * @return {number[]} LMS color in protanopia
		 */
		static brettelP([l, m, s]) {
			return [
				0.0 * l + 2.02344 * m + -2.52581 * s,
				0.0 * l + 1.0     * m +  0.0     * s,
				0.0 * l + 0.0     * m +  1.0     * s,
			];
		}

		/**
		 * Simulate deuteranopia
		 * @param {number[]} lms LMS color
		 * @return {number[]} LMS color in deuteranopia
		 */
		static brettelD([l, m, s]) {
			return [
				1.0      * l + 0.0 * m + 0.0     * s,
				0.494207 * l + 0.0 * m + 1.24827 * s,
				0.0      * l + 0.0 * m + 1.0     * s,
			];
		}

		/*
		 * Reference: Katsunori Okajima, Syuu Kanbe,
		 * A Real-time Color Simulation of Dichromats,
		 * IEICE technical report 107(117), 107-110, 2007-06-21.
		 */

		/**
		 * Correct simulation of protanopia
		 * @param {number} m Original M of LMS color
		 * @param {number[]} lms LMS color of protanopia simulation
		 * @param {number[]} base Base LMS color
		 * @return {number[]} LMS color in protanopia
		 */
		static okajimaCorrectionP(m, [l2, m2, s2], base) {
			const sp1 = m / base[1];
			const dp0 = l2 / base[0];
			const dp1 = m2 / base[1];
			const dp2 = s2 / base[2];
			const k = ColorVisionSimulation.BETA * sp1 / (ColorVisionSimulation.ALPHA * dp0 + ColorVisionSimulation.BETA * dp1);
			return [
				(k * dp0) * base[0],
				(k * dp1) * base[1],
				(k * dp2) * base[2]
			];
		}

		/**
		 * Correct simulation of deuteranopia
		 * @param {number} l Original L of LMS color
		 * @param {number[]} lms LMS color of deuteranopia simulation
		 * @param {number[]} base Base LMS color
		 * @return {number[]} LMS color in deuteranopia
		 */
		static okajimaCorrectionD(l, [l2, m2, s2], base) {
			const sp0 = l / base[0];
			const dp0 = l2 / base[0];
			const dp1 = m2 / base[1];
			const dp2 = s2 / base[2];
			const k = ColorVisionSimulation.ALPHA * sp0 / (ColorVisionSimulation.ALPHA * dp0 + ColorVisionSimulation.BETA * dp1);
			return [
				(k * dp0) * base[0],
				(k * dp1) * base[1],
				(k * dp2) * base[2]
			];
		}


		// -------------------------------------------------------------------------


		/**
		 * Convert LMS to LMS in protanopia (Method 1).
		 * @param {number[]} lms LMS color
		 * @param {boolean} doCorrection
		 * @return {number[]} LMS color in protanopia
		 */
		static lmsToProtanopia(lms, doCorrection = false) {
			const ds = ColorVisionSimulation.brettelP(lms);
			if (!doCorrection) return ds;
			return ColorVisionSimulation.okajimaCorrectionP(lms[1], ds, ColorVisionSimulation.LMS_BASE);
		}

		/**
		 * Convert LMS to LMS in deuteranopia (Method 1).
		 * @param {number[]} lms LMS color
		 * @param {boolean} doCorrection
		 * @return {number[]} LMS color in deuteranopia
		 */
		static lmsToDeuteranopia(lms, doCorrection = false) {
			const ds = ColorVisionSimulation.brettelD(lms);
			if (!doCorrection) return ds;
			return ColorVisionSimulation.okajimaCorrectionD(lms[0], ds, ColorVisionSimulation.LMS_BASE);
		}


		// -------------------------------------------------------------------------


		/**
		 * Convert Linear RGB to LMS in protanopia (Method 2).
		 * @param {number[]} lrgb Linear RGB color
		 * @param {boolean} doCorrection
		 * @return {number[]} LMS color in protanopia
		 */
		static lrgbToProtanopia([lr, lg, lb], doCorrection = false) {
			const lrgb2 = [
				0.992052 * lr + 0.003974,
				0.992052 * lg + 0.003974,
				0.992052 * lb + 0.003974,
			];
			const lms = COLOR_SPACE_NS.LMS.fromXYZ(COLOR_SPACE_NS.XYZ.fromLRGB(lrgb2));
			const lms2 = ColorVisionSimulation.brettelP(lms);

			let lms3;
			if (doCorrection) {
				lms3 = ColorVisionSimulation.okajimaCorrectionP(lms[1], lms2, ColorVisionSimulation.LMS_BASE2);
			} else {
				lms3 = lms2;
			}
			return COLOR_SPACE_NS.LRGB.fromXYZ(COLOR_SPACE_NS.XYZ.fromLMS(lms3));
		}

		/**
		 * Convert Linear RGB to LMS in deuteranopia (Method 2).
		 * @param {number[]} lrgb Linear RGB color
		 * @param {boolean} doCorrection
		 * @return {number[]} LMS color in deuteranopia
		 */
		static lrgbToDeuteranopia([lr, lg, lb], doCorrection = false) {
			const lrgb2 = [
				0.957237 * lr + 0.0213814,
				0.957237 * lg + 0.0213814,
				0.957237 * lb + 0.0213814,
			];
			const lms = COLOR_SPACE_NS.LMS.fromXYZ(COLOR_SPACE_NS.XYZ.fromLRGB(lrgb2));
			const lms2 = ColorVisionSimulation.brettelD(lms);

			let lms3;
			if (doCorrection) {
				lms3 = ColorVisionSimulation.okajimaCorrectionD(lms[0], lms2, ColorVisionSimulation.LMS_BASE2);
			} else {
				lms3 = lms2;
			}
			return ColorVisionSimulation.LRGB.fromXYZ(COLOR_SPACE_NS.XYZ.fromLMS(lms3));
		}

	}

	ColorVisionSimulation.LMS_BASE  = COLOR_SPACE_NS.LMS.fromXYZ([1, 1, 1]);
	ColorVisionSimulation.LMS_BASE2 = COLOR_SPACE_NS.LMS.fromXYZ(COLOR_SPACE_NS.XYZ.fromLRGB([1, 1, 1]));

	ColorVisionSimulation.ALPHA = 1;
	ColorVisionSimulation.BETA  = 1;


	// ライブラリを作る --------------------------------------------------------


	return {
		conspicuityOfLab    : Evaluation.conspicuityOfLab,
		differenceBetweenLab: Evaluation.differenceBetweenLab,
		categoryOfYxy       : Evaluation.categoryOfYxy,
		distance            : Evaluation.distance,

		lmsToProtanopia   : ColorVisionSimulation.lmsToProtanopia,
		lmsToDeuteranopia : ColorVisionSimulation.lmsToDeuteranopia,
		lrgbToProtanopia  : ColorVisionSimulation.lrgbToProtanopia,
		lrgbToDeuteranopia: ColorVisionSimulation.lrgbToDeuteranopia,

		labToElderlyAB: AgeSimulation.labToElderlyAB,
		labToYoungAB  : AgeSimulation.labToYoungAB,

		Evaluation, ColorVisionSimulation, AgeSimulation,
	};

})();
