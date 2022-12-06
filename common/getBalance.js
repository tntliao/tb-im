/**
 * @example let loo=new Wallet(loo_address)
 * @property {Object} control 实例化控制器
 * @property {function} send 交易
 * @example loo.send(address,value).then(res=>)
 * @event getBalance 获取余额
 * @example loo.getBalance(address).then(res=>)
 */
class Wallet {
	constructor(address, callback) {
		if (window.tronWeb) {
			tronWeb.contract().at(address)
				.then(res => {
					console.log(res);
					this.control = res
					this.getBalance = this.getBalance
					callback()
				}).catch(err => {
					console.log(err);
				})
		}
	}
	/**
	 * 获取余额
	 * @param {String} address 钱包地址
	 * @returns {Object} Promise
	 */
	getBalance(address) {
		return new Promise((resolve, reject) => {
			this.control.balanceOf(address).call().then(res => {
				resolve(res.toNumber())
			})
		})
	}
}
export default Wallet
