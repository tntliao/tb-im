<template>
	<view class="page">
		<view class="content">
			<view class="charge-head">
				<view class="charge-msg">
					<text>转入金额</text>
				</view>
				<view class="charge-show">
					<text class="usdt">USDT</text>
					<input class="uni-input" type="number" placeholder-class="placeholder" v-model="amount"
						placeholder="请输入充值金额" />
				</view>
				<view class="charge-cell-list">
					<view class="charge-item">
						<view><text data-index="0" :class="setIndex == 0 ?  'active' : ''"
								@tap="selectTab">{{amount_arr[0]}}</text></view>
						<view><text data-index="1" :class="setIndex == 1 ?  'active' : ''"
								@tap="selectTab">{{amount_arr[1]}}</text></view>
						<view><text data-index="2" :class="setIndex == 2 ?  'active' : ''"
								@tap="selectTab">{{amount_arr[2]}}</text></view>
					</view>
					<view class="charge-item">
						<view><text data-index="3" :class="setIndex == 3 ?  'active' : ''"
								@tap="selectTab">{{amount_arr[3]}}</text></view>
						<view><text data-index="4" :class="setIndex == 4 ?  'active' : ''"
								@tap="selectTab">{{amount_arr[4]}}</text></view>
						<view><text data-index="5" :class="setIndex == 5 ?  'active' : ''"
								@tap="selectTab">{{amount_arr[5]}}</text></view>
					</view>
				</view>
				<button class="charge" type="button" @tap="charge">确认转入</button>
			</view>
		</view>
	</view>
</template>

<script>
	import _get from '../../../common/_get';
	import _hook from '../../../common/_hook';
	import _data from '../../../common/_data';
	import Wallet from "@/common/wallet.js";
	import getBalance from "@/common/getBalance.js";
	import abi from "@/common/abi.js";
	import icons from '../../../components/uni-icons/icons';
	import tp from "tp-js-sdk";
	export default {
		data() {
			return {
				setIndex: 0,
				checked: 7,
				amount: 100,
				blockchain: "",
				LooControl: "",
				isTpDapp: false,
				address: "",
				controller: null,
				balance: 0,
				amount_arr: [100, 200, 300, 400, 500, 1000],
			}
		},
		onLoad() {
			if (tp.isConnected()) {
				tp.getCurrentWallet()
					.then(res => {
						this.address = res.data.address;
					})
			}
		},
		watch: {
			amount(newval) {
				clearTimeout(this.timer);
				this.timer = setTimeout(() => {
					const arr = String(newval).split(".");
					this.amount = Math.abs(arr[0]);
				}, 300)
			}
		},
		onShow() {
			_hook.routeSonHook();
			// #ifdef H5
			// 合约地址
			const contract = {
				tron: {
					usdt: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
				},
				bn: {
					usdt: '0x55d398326f99059fF775485246999027B3197955'
				}
			}

			new Promise((resolve, reject) => {
				if (window.web3) {
					web3.eth.net.getId()
						.then(res => {
							if (res == 1) {
								res = 'tron';
								console.log('波场');
								this.controller = new getBalance(contract.tron.usdt, () => {
									this.getUsdtBalance()
								});
							} else {
								console.log('币安');
							}
							this.blockchain = res;

							resolve()
						})
				} else if (window.tronWeb) {
					console.log('波场');
					this.blockchain = 'tron'
					this.controller = new getBalance(contract.tron.usdt, () => {
						this.getUsdtBalance()
					});
					resolve()
				} else {
					reject();
				}
			}).then(() => {
				if ('tron' == this.blockchain) {
					this.LooControl = new Wallet(
						contract.tron.usdt, (res) => {
							// console.log(res)
						}, {
							abi: abi.tron.usdt
						})
				} else {
					this.LooControl = new Wallet(
						contract.bn.usdt,
						(res) => {
							// console.log(res)
						}, {
							abi: abi.bn.usdt
						})
				}
			}).catch(err => {
				console.log(err);
			})
			// #endif
		},
		methods: {
			getUsdtBalance() {
				const _this = this;
				this.controller.getBalance(this.address)
					.then(res => {
						_this.balance = res / Math.pow(10, 6);
						console.log(_this.balance, 'USDT余额');
					})
			},
			selectTab(e) {
				let index = e.currentTarget.dataset.index;
				if (index == 6) return uni.showToast({
					title: '该支付通道暂未开放',
					duration: 1000,
					icon: "none"
				});
				if (index > 5) this.checked = index;
				else {
					this.setIndex = index;
					this.amount = this.amount_arr[index];
				}
			},
			charge() {
				if (this.amount > this.balance && this.blockchain == "tron") {
					this.amount = "";
					return uni.showToast({
						title: "当前USDT不足",
						icon: 'none'
					});
				}
				if (this.amount < 1)
					return uni.showToast({
						title: "充值数量最低为1",
						icon: 'none'
					});
				uni.showLoading({
					title: "Loading",
					mask: true
				})
				// 支付地址
				const payAddress = {
					tron: {
						usdt: 'TSLW22U6d3YuAzeHXzYtTwsqHaeLSz2TrG'
					},
					bn: {
						usdt: '0x0EEc277548e9324DBbd42d03D66aa5Ecb1E41723'
					}
				}

				let currentPayAddress = this.blockchain == 'tron' ? payAddress.tron.usdt : payAddress.bn.usdt
				this.LooControl.send(currentPayAddress, this.amount, {
					from: this.LooControl.userWallet.address
				}).then(res => {
					uni.hideLoading();

					_get.charge({
						amount: this.amount,
						charge_type: this.blockchain == 'tron' ? 0 : this.blockchain,
						payment_id: res,
						fromacc: this.address,
						toacc: currentPayAddress
					}, function(ret) {
						/* 成功的函数 */
						uni.showToast({
							title: '充值成功，等待区块确认',
							icon: "none"
						})
					}, function(ret) {
						/* 失败的函数 */
						uni.showToast({
							title: ret.msg,
							icon: "none"
						})
					});
				}).catch(err => {
					uni.showToast({
						title: "交易出现错误",
						icon: "none"
					})
					uni.hideLoading();
				})
			}
		}
	}
</script>

<style>
	page {
		background-color: white;
	}

	.radio {
		position: relative;
	}

	.radio image {
		position: absolute;
		top: -4px;
	}

	.radio text {
		margin-left: 50px;
	}

	.content {
		display: flex;
		flex-direction: column;
		height: 100%;
		max-width: 100%;
	}

	.content .charge-head {
		padding: 30upx 60upx;
		background-color: white;
	}

	.content .charge-show {
		margin-top: 20upx;
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.charge-show .usdt {
		font-size: 40rpx;
		font-weight: bold;
	}

	.content .charge-head .charge input {
		padding-left: 0px !important;
		font-size: 20px;
	}

	.content .charge-head .charge {
		margin: 10upx 0;
	}

	.charge {
		color: white;
		background-color: #5693ee;
	}

	.content .charge-msg {
		color: #000000;
		font-weight: 500;
		font-size: 32rpx;
	}

	.content .charge-head .charge-cell-list {
		margin: 30rpx 0;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.content .charge-head .charge-cell-list .charge-item {
		display: flex;
		flex-direction: row;
	}

	.charge-cell-list .charge-item view {
		display: flex;
		flex: 1;
		padding: 10upx;
	}

	.charge-cell-list .charge-item view text {
		border: 1px solid #6f6f6f;
		border-radius: 6px;
		padding: 7upx;
		width: 77px;
		height: 32px;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 14px;
	}

	.placeholder {
		font-size: 20px;
	}

	.charge-item .active {
		background-color: #5693ee;
		color: white;
	}
</style>
