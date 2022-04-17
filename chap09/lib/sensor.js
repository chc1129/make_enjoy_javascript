/**
 * センサー・ライブラリ（SENSOR）
 *
 * 様々なセンサーを使えるようにするライブラリです。
 *
 * @author Takuto Yanagida
 * @version 2020-12-17
 */


/**
 * ライブラリ変数
 */
const SENSOR = (function () {

	'use strict';


	class Sensor {
		constructor() {}
	}


	/**
	 * カメラ・センサー
	 * @extends {Sensor}
	 * @version 2020-12-17
	 */
	class Camera extends Sensor {

		/**
		 * カメラ・センサーを作る
		 * @constructor
		 * @param {number} [width=640] 横幅
		 * @param {number} [height=480] たて幅
		 */
		constructor(width = 640, height = 480) {
			super();

			this._options = {
				audio: false,
				video: {
					width: { ideal: width },
					height: { ideal: height }
				}
			}
			this._video = document.createElement('video');
			this._video.style.display = 'none';
			this._video.width = width;
			this._video.height = height;
			this._video.autoplay = true;
			document.documentElement.appendChild(this._video);
		}

		/**
		 * 始める
		 * @return {Promise}
		 */
		async start() {
			try {
				const stream = await this._process(this._options);
				this._success(stream);
			} catch(e) {
				this._error(e);
			}
		}

		/**
		 * 処理する（ライブラリ内だけで使用）
		 * @private
		 * @param {object} options オプション
		 * @return {Promise}
		 */
		async _process(options) {
			return await navigator.mediaDevices.getUserMedia(options);
		}

		/**
		 * 処理が成功した（ライブラリ内だけで使用）
		 * @private
		 * @param {MediaStream} stream メディア・ストリーム
		 */
		_success(stream) {
			this._video.srcObject = stream;
		}

		/**
		 * エラーが発生した（ライブラリ内だけで使用）
		 * @private
		 */
		_error() {
			throw new Error('カメラを使用できません。');
		}

		/**
		 * カメラの画像を取得
		 * @return {HTMLVideoElement} 画像
		 */
		getImage() {
			return this._video;
		}

	}


	/**
	 * マイクロフォン・センサー
	 * @extends {Sensor}
	 * @version 2020-12-17
	 */
	class Microphone extends Sensor {

		/**
		 * マイクロフォン・センサーを作る
		 * @constructor
		 */
		constructor() {
			super();
			this._buffer = null;
		}

		/**
		 * 始める
		 * @return {Promise}
		 */
		async start() {
			try {
				const stream = await this._process();
				this._success(stream);
			} catch(e) {
				this._error(e);
			}
		}

		/**
		 * 処理する（ライブラリ内だけで使用）
		 * @private
		 * @return {Promise}
		 */
		async _process() {
			return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
		}

		/**
		 * 処理が成功した（ライブラリ内だけで使用）
		 * @private
		 * @param {MediaStream} stream メディア・ストリーム
		 */
		_success(stream) {
			this._context = new AudioContext();
			this._a = this._context.createAnalyser();
			this._m = this._context.createMediaStreamSource(stream);
			this._m.connect(this._a);
			this._buffer = new Uint8Array(this._a.fftSize);
		}

		/**
		 * エラーが発生した（ライブラリ内だけで使用）
		 * @private
		 */
		_error() {
			throw new Error('マイクロフォンを使用できません。');
		}

		/**
		 * マイクロフォンのレベルを取得
		 * @return {number} レベル 0.0 - 1.0
		 */
		getLevel() {
			if (!this._buffer) {
				return 0;
			}
			this._a.getByteTimeDomainData(this._buffer);
			let max = 0;
			for (const v of this._buffer) {
				if (max < v - 128) max = v - 128;
			}
			return max / 127;
		}

	}


	/**
	 * ジオロケーション・センサー
	 * @extends {Sensor}
	 * @version 2020-12-17
	 */
	class Geolocation extends Sensor {

		/**
		 * ジオロケーション・センサーを作る
		 * @constructor
		 */
		constructor() {
			super();

			this._options = {
				enableHighAccuracy: false,
				timeout: 8000,
				maximumAge: 2000,
			};
			this._location = { latitude: Number.NaN, longitude: Number.NaN };
		}

		/**
		 * 始める
		 * @return {Promise}
		 */
		async start() {
			try {
				const pos = await this._process(this._options);
				this._success(pos);
			} catch (e) {
				this._error(e);
			}
		}

		/**
		 * 処理する（ライブラリ内だけで使用）
		 * @private
		 * @param {object} options オプション
		 * @return {Promise}
		 */
		async _process(options) {
			return await new Promise((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, options);
			})
		}

		/**
		 * 処理が成功した（ライブラリ内だけで使用）
		 * @private
		 * @param {MediaStream} stream メディア・ストリーム
		 */
		_success(pos) {
			this._location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
		}

		/**
		 * エラーが発生した（ライブラリ内だけで使用）
		 * @private
		 */
		_error() {
			throw new Error('ジオロケーションを取得できません。');
		}

		/**
		 * 現在位置を取得
		 * @return {object} 緯度経度
		 */
		getLocation() {
			return this._location;
		}

	}


	/**
	 * 天気センサー
	 * @extends {Sensor}
	 * @version 2021-02-04
	 */
	class Weather extends Sensor {

		/**
		 * 天気センサーを作る
		 * @constructor
		 * @param {number} [latitude=43] 緯度
		 * @param {number} [longitude=141] 経度
		 */
		constructor(latitude = 43, longitude = 141) {
			super();

			this._latitude = latitude;
			this._longitude = longitude;
		}

		/**
		 * 始める
		 * @return {Promise}
		 */
		async start() {
			try {
				const res = await this._process(this._latitude, this._longitude);
				this._success(res);
			} catch (e) {
				this._error(e);
			}
		}

		/**
		 * 処理する（ライブラリ内だけで使用）
		 * @private
		 * @param {number} latitude 緯度
		 * @param {number} longitude 経度
		 * @return {Promise}
		 */
		async _process(latitude, longitude) {
			const response = await fetch(`https://laccolla.com/api/weather/v1/?lat=${latitude}&lon=${longitude}`, {
				mode: 'cors',
				cache: 'no-cache',
				credentials: 'same-origin',
				headers: { 'Content-Type': 'application/json; charset=utf-8', },
				referrer: 'no-referrer',
			});
			return response.json();
		}

		/**
		 * 処理が成功した（ライブラリ内だけで使用）
		 * @private
		 * @param {object} res JSON
		 */
		_success(res) {
			this._res = res;
		}

		/**
		 * エラーが発生した（ライブラリ内だけで使用）
		 * @private
		 */
		_error() {
			throw new Error('天気を取得できません。');
		}

		/**
		 * 天気の情報を取得
		 * @return {object} 天気の情報
		 */
		getWeather() {
			return this._res;
		}

	}


	/**
	 * モーション・センサー
	 * @extends {Sensor}
	 * @version 2021-05-21
	 */


	CROQUJS.loadScriptSync('https://laccolla.com/api/wemote/v1/receiver.min.js');

	class Motion extends Sensor {

		/**
		 * モーション・センサーを作る
		 * @constructor
		 */
		constructor() {
			super();

			this._state = false;

			this._ori = null;
			this._acc = null;
			this._acg = null;
			this._rot = null;

			this._id           = '';
			this._qrCode       = null;
			this._stShowQrCode = null;
		}

		/**
		 * センサーをトグルする（ライブラリ内だけで使用）
		 * @private
		 * @param {boolean} state 状態
		 */
		_toggleSensor(state) {
			if (state) {
				this._id = WEMOTE.RECEIVER.createId();
				WEMOTE.RECEIVER.start(this._id, (e) => { this._onMessage(e); }, (e) => { this._onStateChanged(e); });
			} else {
				WEMOTE.RECEIVER.stop();
			}
		}

		/**
		 * センサーの状態が変わった（ライブラリ内だけで使用）
		 * @private
		 * @param {string} e 状態
		 */
		_onStateChanged(e) {
			console.log(e);
			if (e === 'open') {
				this._stShowQrCode = setTimeout(() => { this._showQrCode(this._id); }, 400);
			} else if (e === 'connect') {
				clearTimeout(this._stShowQrCode);
				this._hideQrCode();
			} else if (e === 'disconnect') {
				this._state = false;
				this._ori = null;
				this._acc = null;
				this._acg = null;
				this._rot = null;
				this._id = '';
			}
		}

		/**
		 * QRコードを表示する（ライブラリ内だけで使用）
		 * @private
		 * @param {string} id ID
		 */
		_showQrCode(id) {
			const d = this._makeQrCodeParent();
			WEMOTE.RECEIVER.createQrCode(d, id);
			d.querySelector('img').style.border = 'solid 8px #fff';
			d.addEventListener('click', () => {
				WEMOTE.RECEIVER.stop();
				this._state = false;
				document.body.removeChild(d);
			});
			this._qrCode = d;
		}

		/**
		 * QRコードを非表示にする（ライブラリ内だけで使用）
		 * @private
		 */
		_hideQrCode() {
			document.body.removeChild(this._qrCode);
			this._qrCode = null
		}

		/**
		 * QRコードを表示する親要素を作る（ライブラリ内だけで使用）
		 * @private
		 * @return {HTMLElement} HTML要素
		 */
		_makeQrCodeParent() {
			const d = document.createElement('div');
			d.style.position = 'fixed';
			d.style.top      = '0';
			d.style.left     = '0';
			d.style.right    = '0';
			d.style.bottom   = '0';

			d.style.display        = 'flex';
			d.style.alignItems     = 'center';
			d.style.justifyContent = 'center';

			d.style.backgroundColor = 'rgba(0,0,0,0.75)';
			document.body.appendChild(d);
			return d;
		}


		// -------------------------------------------------------------------------


		/**
		 * メッセージを受け取った（ライブラリ内だけで使用）
		 * @private
		 * @param {string} e メッセージ
		 */
		_onMessage(e) {
			try {
				const d = JSON.parse(e);
				if (d['orientation']) {
					this._ori = d.orientation;
				} else if (d['acceleration']) {
					this._acc = d.acceleration;
					this._acg = d.acceleration_gravity;
					this._rot = d.rotation;
				}
			} catch(e) {
				console.error(e);
			}
		}


		// -------------------------------------------------------------------------


		/**
		 * 始める
		 * @return {Promise}
		 */
		async start() {
			if (!this._state) {
				this._state = !this._state;
				this._toggleSensor(this._state);
			}
		}

		/**
		 * x軸を中心とした方向
		 * @return {number} 方向 -180 - 180 [deg]
		 */
		orientationX() {
			if (this._ori === null) return Number.NaN;
			return this._ori.x;
		}

		/**
		 * y軸を中心とした方向
		 * @return {number} 方向 -90 - 90 [deg]
		 */
		orientationY() {
			if (this._ori === null) return Number.NaN;
			return this._ori.y;
		}

		/**
		 * z軸を中心とした方向
		 * @return {number} 方向 0 - 360 [deg]
		 */
		orientationZ() {
			if (this._ori === null) return Number.NaN;
			return this._ori.z;
		}

		/**
		 * x軸方向の加速度
		 * @return {number} 加速度 [m/s2]
		 */
		accelerationX() {
			if (this._acc === null) return Number.NaN;
			return this._acc.x;
		}

		/**
		 * y軸方向の加速度
		 * @return {number} 加速度 [m/s2]
		 */
		accelerationY() {
			if (this._acc === null) return Number.NaN;
			return this._acc.y;
		}

		/**
		 * z軸方向の加速度
		 * @return {number} 加速度 [m/s2]
		 */
		accelerationZ() {
			if (this._acc === null) return Number.NaN;
			return this._acc.z;
		}

		/**
		 * x軸方向の重力を含めた加速度
		 * @return {number} 加速度 [m/s2]
		 */
		accelerationGravityX() {
			if (this._acg === null) return Number.NaN;
			return this._acg.x;
		}

		/**
		 * y軸方向の重力を含めた加速度
		 * @return {number} 加速度 [m/s2]
		 */
		accelerationGravityY() {
			if (this._acg === null) return Number.NaN;
			return this._acg.y;
		}

		/**
		 * z軸方向の重力を含めた加速度
		 * @return {number} 加速度 [m/s2]
		 */
		accelerationGravityZ() {
			if (this._acg === null) return Number.NaN;
			return this._acg.z;
		}

		/**
		 * x軸を中心とした角速度
		 * @return {number} 角速度 -360 - 360 [deg/s]
		 */
		rotationX() {
			if (this._rot === null) return Number.NaN;
			return this._rot.x;
		}

		/**
		 * y軸を中心とした角速度
		 * @return {number} 角速度 -360 - 360 [deg/s]
		 */
		rotationY() {
			if (this._rot === null) return Number.NaN;
			return this._rot.y;
		}

		/**
		 * z軸を中心とした角速度
		 * @return {number} 角速度 -360 - 360 [deg/s]
		 */
		rotationZ() {
			if (this._rot === null) return Number.NaN;
			return this._rot.z;
		}

	}


	// ライブラリを作る --------------------------------------------------------


	return { Camera, Microphone, Geolocation, Weather, Motion };

}());
