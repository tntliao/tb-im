<template>
	<view class="page" style="overflow: hidden;">
		<!-- #ifdef APP-PLUS -->
		<serving-view :list_id="list_id" @setState="setSeringState" :show="showServing" :state="servingState"
			@closeServing="showServing = false" ref="serving"></serving-view>
		<!-- #endif -->
		<view class="page-content">
			<view class="gong-gao-content" v-if="msgList.type == 1">
				<view class="gong-gao-content-info" v-if="1">
					<view class="iconfont-im icon-gonggao gong-gao-content-info-icon"></view>
					<text-scroll :text="notice" ref="scrollNotice"></text-scroll>
				</view>
			</view>
			<view class="content">
				<scroll-view class="msg-list" :style="{height:scrollHeight}" scroll-y="true"
					:scroll-with-animation="scrollAnimation" :scroll-into-view="scrollToView"
					@scrolltoupper="loadHistory" :upper-threshold="30" id="scrollview" :scroll-top="scrollTop"
					@scroll="scrollEven" @touchstart="hideDrawer(3)">
					<uni-load-more status="noMore" v-if="noMore && !(isHistoryLoading)" />
					<view class="row" v-for="(row,index) in msgList.list" :key="index" :id="'msg' + row.msg.id">
						<!-- 系统消息 -->
						<block v-if="row.type==1">
							<view :class="['system',msgList.type == 1 && index == 0 ? 'sys':'']"
								:style="{padding:'10upx 0',marginBottom:'10upx'}">
								<!-- 文字消息 -->
								<view v-if="row.msg.type==0" class="text">
									{{row.msg.content.text}}
								</view>
								<!-- 领取红包消息 -->
								<view v-if="row.msg.type==5" class="red-envelope" style="letter-spacing:4upx;">
									<image src="/static/img/red-envelope-chat.png" :lazy-load="true" />
									<!-- {{row.msg}} -->
									<block
										v-if="row.msg.content.rid_user_id == my_data.id && row.msg.content.user_id == my_data.id">
										我领取了自己发出的
									</block>
									<block
										v-else-if="row.msg.content.rid_user_id != my_data.id && row.msg.content.user_id == my_data.id">
										我领取了{{row.msg.content.rid_nickname}}发出的
									</block>
									<block
										v-else-if="row.msg.content.rid_user_id == my_data.id && row.msg.content.user_id != my_data.id">
										{{row.msg.content.nickname}}领取了我发出的
									</block>
									<block v-else>
										{{row.msg.content.nickname}}领取了{{row.msg.content.rid_nickname}}发出的
									</block>
									<text style="color: red;" @tap="toDetails(row.msg.content.rid)">红包</text>
								</view>
							</view>
						</block>

						<block
							v-if="row.type == 0 && (index == 0 || (row.msg.time - msgList.list[index - 1].msg.time > 300))">
							<view class="system" style="margin-bottom: 10upx">
								<!-- 文字消息 -->
								<view class="text" style="color: #ffffff;border-radius:12px;font-weight:600">
									{{ timestampFormat(row.msg.time + '') }}
								</view>
							</view>
						</block>

						<!-- 用户消息 -->
						<block v-if="row.type==0">
							<!-- 自己发出的消息 -->
							<view class="my" v-if="row.msg.user_info.uid == my_data.id">
								<!-- 左-消息 -->
								<view class="left"
									@longtap="msgAction(row.msg.id +'',row.msg.user_info.uid + '',row.msg.content.text)"
									:id="row.msg.id" @tap="goLink(row.msg.content.text)">
									<!-- 文字消息 -->
									<view v-if="row.msg.type==0" class="bubble">
										<rich-text :nodes="row.msg.content.text ? getHtml(row.msg.content.text) : ' '"
											space="true" selectable="true" />
									</view>
									<!-- 语言消息 -->
									<view v-if="row.msg.type==1" class="bubble voice" @tap="playVoice(row.msg)"
										:class="playMsgid == row.msg.id?'play':''">
										<view class="length">{{row.msg.content.length}}</view>
										<view class="icon my-voice"></view>
									</view>
									<!-- 图片消息 -->
									<view v-if="row.msg.type==2" class="bubble img" @tap="showPic(row.msg)">
										<!-- 这里 -->
										<!-- <image :src="row.msg.content.url + imgSuffix" -->
										<image :src="(staticPath + row.msg.content.url)"
											:style="{'width': row.msg.content.w+'px','height': row.msg.content.h+'px'}"
											:lazy-load="true" />
									</view>
									<!-- 文件消息 -->
									<view v-if="row.msg.type==10" class="bubble" @tap="downFile(row.msg)">
										<view>{{row.msg.content.filename}}</view>
										<image @error="imageError3" :data-id="index"
											:src="('/static/theme/default/chat/' + row.msg.content.filetype + '.png')"
											:lazy-load="true" style="width: 30px;height: 40px;margin-left:5px" />
									</view>
									<!-- 视频消息 -->
									<view v-if="row.msg.type==3" class="bubble img">
										<!-- <image :src="row.msg.content.save_pic_path" -->
										<image :src="staticPath + row.msg.content.save_pic_path"
											style="width: 320px;height: 240px">
										</image>
										<image class="bubble-bofang" src="/static/theme/default/my/bofang.png"
											style="width: 50px;height: 50px;" @tap="autoVideo(row.msg)"></image>
									</view>

									<!-- 红包 -->
									<view v-if="row.msg.type==5" class="bubble red-envelope"
										@tap="openRedEnvelope(row.msg,index)">
										<image src="/static/img/red-envelope.png" :lazy-load="true"
											:style="{'opacity':(receive_list.indexOf(row.msg.content.rid))< 0 ? 1 : 0.6}">
										</image>
										<view class="tis">
											{{(receive_list.indexOf(row.msg.content.rid)) <0?'恭喜发财，大吉大利':'已领取'}}
										</view>
										<view class="blessing">
											<view class="info">
												{{row.msg.content.blessing}}
											</view>
											<view class="has-get-red">
												点击打开红包
											</view>
										</view>
									</view>
									<!-- 在线视频 -->
									<view v-if="row.msg.type==6" class="bubble">
										<view> {{row.msg.content.text}}
										</view>
										<text style="margin-left:2px" class="iconfont-im">&#xe619;
										</text>
									</view>
									<!-- 在线音频-->
									<view v-if="row.msg.type==7" class="bubble">
										<view> {{row.msg.content.text}}
										</view>
										<text style="margin-left:2px" class="iconfonts">&#xe60b;
										</text>
									</view>
									<!--卡片-->
									<view v-if="row.msg.type==8" class="send-card" @tap="getCard(row.msg)">
										<view class="send-card-content">
											<image :src="staticPhoto+row.msg.content.face" :lazy-load="true"
												style="width: 85upx;height: 85upx;"></image>
											<text>{{row.msg.content.nickname}}</text>
										</view>
										<view class="send-card-content-text">
											<text>名片</text>
										</view>
									</view>
								</view>
								<!-- 右-头像 -->
								<view class="right" @tap="goDetails(row.msg.user_info.uid,row)">
									<image
										:src="(row.msg.is_niming == 1) ? '/static/theme/default/my/niming.png' : myPhoto"
										:lazy-load="true" style="border-radius: 10px;" @error="imageError2" />
								</view>
							</view>

							<!-- 别人发出的消息 -->
							<view class="other" v-if="row.msg.user_info.uid != my_data.id">
								<!-- 左-头像 -->
								<view class="left" @tap="goDetails(row.msg.user_info.uid,row)">
									<image
										:src="(row.msg.is_niming == 1)? '/static/theme/default/my/niming.png' : getNewAvatar(staticPhoto ,row.msg.user_info.face)"
										:lazy-load="true" style="border-radius: 10px;" :data-id="index"
										@error="imageError" />
								</view>
								<!-- 右-用户名称-时间-消息 -->
								<view class="right"
									@longtap="msgAction(row.msg.id +'',row.msg.user_info.uid + '',row.msg.content.text)"
									@tap="goLink(row.msg.content.text)">
									<view class="username">
										<view class="name">{{row.msg.user_info.username}}</view>
									</view>
									<!-- 文字消息 -->
									<view v-if="row.msg.type==0" class="bubble">
										<rich-text :nodes="row.msg.content.text ? getHtml(row.msg.content.text) : ' '"
											space="true" />
									</view>
									<!-- 语音消息 -->
									<view v-if="row.msg.type==1" class="bubble voice" @tap="playVoice(row.msg)"
										:class="playMsgid == row.msg.id?'play':''">
										<view class="icon other-voice"></view>
										<view class="length">{{row.msg.content.length}}</view>
									</view>
									<!-- 图片消息 -->
									<view v-if="row.msg.type==2" class="bubble img" @tap="showPic(row.msg)">
										<!-- <image :src="row.msg.content.url + imgSuffix" -->
										<image :src="(staticPath + row.msg.content.url)"
											:style="{'width': row.msg.content.w+'px','height': row.msg.content.h+'px'}"
											:lazy-load="true" />
									</view>
									<!-- 视频消息 -->
									<view v-if="row.msg.type==3" class="bubble img">
										<image :src=" staticPath + row.msg.content.save_pic_path"
											style="width: 320px;height: 240px"></image>
										<image class="bubble-bofang-left" src="/static/theme/default/my/bofang.png"
											style="width: 50px;height: 50px;" @tap="autoVideo(row.msg)"></image>
									</view>
									<!-- 文件消息 -->
									<view v-if="row.msg.type==10" class="bubble img" @tap="downFile(row.msg)">
										<view>{{row.msg.content.filename}}</view>
										<image :data-id="index"
											:src="('/static/theme/default/chat/' + row.msg.content.filetype + '.png')"
											:lazy-load="true" style="width: 30px;height: 40px;margin-left:5px" />
									</view>
									<!-- 红包 -->
									<view v-if="row.msg.type==5" class="bubble red-envelope"
										@tap="openRedEnvelope(row.msg,index)">
										<image src="/static/img/red-envelope-o.png" :lazy-load="true"
											:style="{'opacity':(receive_list.indexOf(row.msg.content.rid))< 0 ? 1 : 0.6}">
										</image>
										<view class="tis">
											{{(receive_list.indexOf(row.msg.content.rid)) <0?'恭喜发财，大吉大利':'已领取'}}
										</view>
										<view class="blessing">
											<view class="info">
												{{row.msg.content.blessing}}
											</view>
											<view class="has-get-red">
												点击打开红包
											</view>
										</view>
									</view>
									<view v-if="row.msg.type==6" class="bubble">
										<text style="margin-right:2px" class="iconfont-im">&#xe619;
										</text>
										{{row.msg.content.text}}

									</view>
									<view v-if="row.msg.type==7" class="bubble">
										<text style="margin-right:2px" class="iconfonts">&#xe60b;
										</text>
										{{row.msg.content.text}}
									</view>
									<view v-if="row.msg.type==8" class="send-card" @tap="getCard(row.msg)">
										<view class="send-card-content">
											<image :src="staticPhoto+row.msg.content.face" :lazy-load="true"
												style="width: 85upx;height: 85upx;"></image>
											<text>{{row.msg.content.nickname}}</text>
										</view>
										<view class="send-card-content-text">
											<text>名片</text>
										</view>
									</view>
								</view>
							</view>
						</block>
					</view>
				</scroll-view>
			</view>
			<!-- 抽屉栏 -->
			<view class="popup-layer" :class="popupLayerClass" @touchmove.stop.prevent="discard">
				<!-- 表情 -->
				<swiper class="emoji-swiper" :class="{hidden:hideEmoji}" indicator-dots="true" duration="150">
					<swiper-item v-for="(page,pid) in emojiList" :key="pid">
						<view v-for="(em,eid) in page" :key="eid" @tap="addEmoji(em)">
							<image :src="'/static/img/emoji/' + em.url" :lazy-load="true" />
						</view>
					</swiper-item>
				</swiper>
				<!-- 更多功能 相册-拍照-红包 -->
				<view class="more-layer" :class="{hidden:hideMore}">
					<view class="list">
						<view class="list-box" @tap="chooseImage">
							<view class="more_icon album"></view>
							<view class="tool_text">相册</view>
						</view>

						<view class="list-box" @tap="camera">
							<view class="more_icon camera"></view>
							<view class="tool_text">拍摄</view>
						</view>

						<view class="list-box" @tap="video">
							<view class="more_icon video"></view>
							<view class="tool_text">视频</view>
						</view>

						<view class="list-box" @tap="handRedEnvelopes">
							<view class="more_icon hongbao"></view>
							<view class="tool_text">红包</view>
						</view>
					</view>
					<view class="list" style="margin-top: 8upx;">
						<view class="list-box" @tap="chooseCard">
							<view class="more_icon card"></view>
							<view class="tool_text2">名片</view>
						</view>

						<view class="list-box" @tap="camera" v-if="0">
							<view class="iconfont-im iconlocation"></view>
							<view class="tool_text2">位置</view>
						</view>
						<!-- #ifdef APP-PLUS -->
						<view class="list-box" @tap="videoCall(2)" v-if="msgList.obj_id !== 1">
							<view class="more_icon voicephone"></view>
							<view class="tool_text">语音通话</view>
						</view>
						<tki-file-manager ref="filemanager" @result="resultPath"></tki-file-manager>
						<!-- #endif -->
						<!-- #ifdef H5 -->
						<view class="list-box" @tap="openDown = true" v-if="msgList.obj_id !== 1 && msgList.type == 0">
							<view class="more_icon voicephone"></view>
							<view class="tool_text">语音通话</view>
						</view>
						<!-- #endif -->
						<view class="list-box" @tap="sayCall()" v-if="msgList.type == 1 && 0">
							<text class="iconfont-im icon-niming" style="font-size:50upx;">
							</text>
							<view class="tool_text">{{niming_msg}}</view>
						</view>
						<view class="list-box" @tap="zhendong" v-if="msgList.type == 1  && is_main">
							<view class="iconfont-im icon-zhendong"></view>
							<view class="tool_text2">振动</view>
						</view>
						<!-- #ifdef APP-PLUS -->
						<view class="list-box" @tap="openfile">
							<view class="more_icon file"></view>
							<view class="tool_text">文件</view>
						</view>
						<!-- #endif -->
						<!-- #ifdef H5 -->
						<view class="list-box" @tap="openfileh5()">
							<view class="more_icon file"></view>
							<view class="tool_text">文件</view>
						</view>
						<!-- #endif -->
						<view class="list-box" @tap="showQiang()" v-if="msgList.type == 1 && vendor_status && is_main">
							<text class="iconfont-im icon-qiang" style="font-size:50upx;">
							</text>
							<view class="tool_text">发包</view>
						</view>
						<text ref="input" class="input" style="display: none;"></text>
					</view>

				</view>
			</view>
			<view v-if="showtype" style="position: absolute; width: 100%; height: 100%;z-index: 21;">
				<view
					style="position: absolute;width: 150px;left:calc(50% - 75px); top: 40%; background-color: rgba(0, 0, 0, 0.5);border-radius:10px; text-align: center; padding:30upx 0">
					<cmd-progress type="dashboard" :percent="loadjd" stroke-color="#2AC979"></cmd-progress>
					<view style="font-size: 14px; color:#ffffff">发送中</view>
				</view>
			</view>
			<view class="input-box" v-if="msgList.is_msg">
				<view
					style="text-align: center !important;width:750upx;line-height: 100upx;border-top: #c9c9c9 solid 2upx;">
					全员禁言中...
				</view>
			</view>

			<view class="input-box" v-if="msgList.is_msg">
				<view
					style="text-align: center !important;width:750upx;line-height: 100upx;border-top: #c9c9c9 solid 2upx;">
					全员禁言中...
				</view>
			</view>
			<!-- 底部输入栏 -->
			<view class="input-box" :class="popupLayerClass" v-else>
				<!-- H5下不能录音，输入栏布局改动一下 -->
				<!-- #ifndef H5 -->
				<view class="voice">
					<view class="icon" :class="isVoice?'jianpan':'yuyin'" @tap="switchVoice"></view>
				</view>
				<!-- #endif -->

				<!-- #ifdef H5 -->
				<view class="more" @tap="showMore">
					<view class="icon add"></view>
				</view>
				<!-- #endif -->
				<view class="textbox">
					<view class="voice-mode" :class="[isVoice?'':'hidden',recording?'recording':'']"
						@touchstart="voiceBegin" @touchmove.stop.prevent="voiceIng" @touchend="voiceEnd"
						@touchcancel="voiceCancel">
						{{voiceTis}}
					</view>
					<view class="text-mode" :class="isVoice?'hidden':''">
						<view class="box">
							<textarea auto-height="true" @input="inputText" :value="textMsg" @focus="textareaFocus"
								@blur="closeKey" :show-confirm-bar="false"
								style="max-height: 190upx;overflow:auto;border: 1px solid black; border-radius: 17px;padding-top: 4px;padding-bottom: 4px; " />
						</view>
						<view class="em" @tap="chooseEmoji">
							<view class="icon biaoqing"></view>
						</view>
					</view>
				</view>
				<!-- #ifndef H5 -->
				<view :class="iconShow" @tap="showMore">
					<view class="icon add"></view>
				</view>
				<!-- #endif -->
				<view class="send" :class="sendMsgClass" @tap="sendText">
					<view class="btn">发送</view>
				</view>
			</view>
		</view>
		<view v-if="showVedio" class="showVedio">
			<video autoplay="true" page-gesture="true" controls="false" style="height: 100%;width: 100%" id="myVideo"
				:src="videoPath" @error="videoErrorCallback">
				<cover-image @tap="showVedio = false" src="/static/theme/default/my/close.png" class="cloneBut">
				</cover-image>
			</video>
		</view>


		<!-- #ifndef H5 -->
		<!-- 录音UI效果 -->
		<view class="record" :class="recording?'':'hidden'">
			<view class="ing" :class="willStop?'hidden':''">
				<view class="icon luyin2"></view>
			</view>
			<view class="cancel" :class="willStop?'':'hidden'">
				<view class="icon chehui"></view>
			</view>
			<view class="tis" :class="willStop?'change':''">{{recordTis}}</view>
		</view>
		<!-- #endif -->

		<!-- 红包弹窗 -->
		<view class="windows" :class="windowsState">
			<!-- 遮罩层 -->
			<view class="mask" @touchmove.stop.prevent="discard" @tap="closeRedEnvelope"></view>
			<view class="layer" @touchmove.stop.prevent="discard">
				<view class="open-redenvelope">
					<view class="top">
						<view class="close-btn">
							<view class="icon close" @tap="closeRedEnvelope"></view>
						</view>
						<image :src="staticPhoto+redenvelopeData.face" :lazy-load="true"></image>
					</view>
					<view class="from">来自{{redenvelopeData.from}}的红包</view>
					<view class="blessing">{{redenvelopeData.blessing}}</view>
					<view class="money" @tap="openRed(redenvelopeData)">

						<image :class="luckbtn" src="/static/theme/default/my/red_2.png"
							style="width: 180upx; height: 180upx;"></image>
					</view>
					<view class="showDetails" @tap="toDetails(redenvelopeData.rid)">
						查看领取详情
						<view class="icon to"></view>
					</view>
				</view>
			</view>
		</view>
		<!-- 转发弹窗 -->
		<view class="windows" :class="zhuanwindowsState">
			<!-- 遮罩层 -->
			<view class="mask" @touchmove.stop.prevent="discard" @tap="closeZhuanWindow"></view>
			<view class="layer" @touchmove.stop.prevent="discard">
				<view class="zhuanmain">
					<view class="top">
						选择转发对象
					</view>
					<view class="zhuanshowDetails">
						<scroll-view scroll-y="true" style="height: 800upx;">
							<view>
								<block v-for="(list, key) in list_data" :key="key">
									<view class="uni-list-cell-divider" :id="list.letter">
										{{list.letter}}
									</view>
									<view class="uni-list-cell" hover-class="none"
										:class="list.data.length -1 == index ? 'uni-list-cell-last' : ''"
										v-for="(item,index) in list.data" :key="isKey(key,index)">
										<uni-swipe-action :options="[ {text: '备注'} ]"
											@tap="swipeAction(item.user_id + '')">
											<view class="uni-media-list" @tap="zhuanMsg(item.user_id + '')">
												<view class="uni-media-list-logo">
													<image :src="photo(item.photo+'')" :lazy-load="true"
														style="border-radius: 10px;" />
												</view>
												<view class="uni-media-list-body">
													<view class="uni-list-cell-navigate">{{item.name}}</view>
												</view>
											</view>
										</uni-swipe-action>
									</view>
								</block>
							</view>
						</scroll-view>

					</view>
				</view>
			</view>
		</view>
		<uni-popup ref="popup2" :show="videPoup" position="bottom" mode="666">
			<view class="video-but-view">
				<button class="video-but" type="primary" @tap="videoBut('video')" :loading="videoLoading">视频聊天</button>
				<button class="video-but" type="primary" @tap="videoBut('voice')" :loading="voiceLoading">语音聊天</button>
				<button type="default" @click="videPoup=false">取消</button>
			</view>
		</uni-popup>
		<uni-popup ref="popup" type="confirm">
			<uni-popup-confirm title="温馨提示" :content="popuMsg" @confirm="confirm"> </uni-popup-confirm>
		</uni-popup>
		<uni-popup ref="qiang" type="qiang">
			<uni-popup-qiang title="开启发包" :status="miaoqiang + ''" :content="popuMsg" @confirm="goQiang">
			</uni-popup-qiang>
		</uni-popup>
		<view class="showImage" v-show="openDown" @click="openDown=false">
			<view class="centent_box">
				<image @longtap="toDownload" src="@/static/img/chat/code.png" mode="aspectFit"></image>
				<view class="detail">
					语音请下载APP
				</view>
			</view>
		</view>
	</view>
</template>
<script>
	import uniLoadMore from "../../components/uni-ui/uni-load-more/uni-load-more.vue";
	import emoj_data from '../../static/js/message/emoji_data.js';
	import _get from '../../common/_get';
	import _hook from '../../common/_hook';
	import _action from '../../common/_action';
	import _data from '../../common/_data';
	import htmlParser from '../../common/html-parser';
	import uniPopup from '../../components/uni-popup/uni-popup.vue';
	import uniPopupConfirm from '../../components/uni-popup/uni-popup-confirm.vue';
	import uniPopupQiang from '../../components/uni-popup/uni-popup-qiang.vue';
	import textScroll from '../../components/textScroll/textScroll.vue';
	import {
		mapState,
		mapMutations
	} from 'vuex';
	import _mixins from '../../common/_mixins';
	import cmdProgress from "@/components/cmd-progress/cmd-progress.vue"
	export default {
		components: {
			uniLoadMore,
			uniPopup,
			uniPopupConfirm,
			uniPopupQiang,
			textScroll,
			cmdProgress
		},
		data() {
			return {
				openDown: false,
				opfiletype: 0,
				showtype: 0,
				servingState: 3,
				onLine: false,
				showServing: false,
				memberPhotos: [],
				is_main: 0,
				redTimer: null,
				websockettype: null,
				loadtype: 0,
				loadnum: 0,
				notice: '',
				scrollInfo: {
					input_box_height1: 0,
					input_box_height2: 0,
					totall_height: 0,
				},
				scrollHeight: "0px",
				niming_msg: '匿名',
				videoContext: null,
				videoPath: '',
				showVedio: false,
				receive_list: [],
				luckbtn: '',
				scrollTop: 0,
				chat_id: '',
				curmsgid: 0,
				//文字消息
				videPoup: false,
				videPlay: false,
				voiceLoading: false,
				videoLoading: false,
				textMsg: '',
				//消息列表
				isHistoryLoading: false,
				scrollAnimation: false,
				scrollToView: '',
				msgList: {
					show_name: '',
					list: [],
					type: 0,
					is_msg: 0,
					is_action: 0,
				},
				msgImgList: [],
				noMore: 0,

				isVoice: false,
				voiceTis: '按住 说话',
				recordTis: "手指上滑 取消发送",
				recording: false,
				willStop: false,
				initPoint: {
					identifier: 0,
					Y: 0
				},
				recordTimer: null,
				recordLength: 0,
				// #ifdef APP-PLUS
				call: uni.requireNativePlugin('Html5App-TencentCall'),
				// #endif
				playMsgid: null,
				VoiceTimer: null,
				// 抽屉参数
				popupLayerClass: '',
				// more参数
				hideMore: true,
				//表情定义
				hideEmoji: true,
				emojiList: emoj_data.emoji_list,

				//表情图片图床名称 ，由于我上传的第三方图床名称会有改变，所以有此数据来做对应，您实际应用中应该不需要
				//onlineEmoji: emoj_data.online_emoji,

				//红包相关参数
				windowsState: '',
				zhuanwindowsState: '',
				redenvelopeData: {
					rid: null, //红包ID
					from: null,
					face: null,
					blessing: null,
					money: null,
					index: null
				},
				list_id: 0,
				list_data: [],
				frien_list: [],
				my_data: {},
				style: {
					pageHeight: 0,
					contentViewHeight: 0,
					footViewHeight: 90,
					mitemHeight: 0
				},
				call_ret: false,
				my_photo: '',
				callType: 1, //默认视频,
				popuMsg: '',
				payTimer: false,
				type: '',
				Keyboard: 0,
				miaoqiang: 0,
				vendor_status: 0,
				doubleClick: false,
				doubleTime: {
					firstTime: '',
					towTime: '',
					flag: true,
					timer: null,
				},
				group_state: null,
				loadjd: 0,
				uptask: null,
				filemsg: null,
				filesendtype: 0
			};
		},
		onBackPress(options) {
			console.log(options)
			uni.navigateTo({
				url: '/pages/chat/index'
			});
			return false;
		},
		onLoad(option) {
			this.list_id = option.list_id;
			if ("chat_id" in option) {
				this.chat_id = option.chat_id;
			}
			if ("trans" in option) {
				uni.showToast({
					title: '转发成功',
					icon: 'none',
					ducation: 2000,
				});
			}
			//注册事件
			// 注册发送音频事件
			this.regOnStartEvent((e) => {
				this.recordBegin(e);
			});
			// 注册发送音频事件
			this.regSendVoiceEvent((e) => {
				this.recordEnd(e);
			});

			// 注册发送音频事件
			this.regVudioEndEvent((e) => {
				this.playMsgid = null;
			});
		},
		onUnload() {
			/** 这里只保留最新的15条会话记录，以保证初次加载性能 */
			let _this = this;
			let chat_data = this.msgList;
			chat_data.list = chat_data.list.slice(-75);
			_data.localData(this.list_id, chat_data);
			/** 去除当前会话的list_id */
			_data.localData('message_list_id', '');
			/** 暂停语音播放 */
			// this.AUDIO.pause();
			/** 移除监听事件 */
			uni.$off('data_chat_data_unshift');
			uni.$off('data_chat_data_push');
			uni.$off('data_chat_data');
			uni.$off('data_user_info');
			uni.$off('data_chat_data_delete');
			uni.$off('update_text_msg');
			uni.$off('memberJoinRoom');
			uni.$off('closeVoiceRoom');
			clearInterval(_this.timer)
			clearInterval(_this.redTimer);

			if (_data.data('voice_room_type')) {
				_this.$refs.serving.xiaMai(_this.list_id);
			} else {
				_this.$refs.serving && _this.$refs.serving.closeVoiceRoom();
			}
		},
		mounted() {
			let _this = this
			if (this.chat_id) {
				this.$nextTick(() => {
					this.scrollToView = "msg" + this.chat_id
				})
			}
			setTimeout(function() {
				_this.getScrollContentHeight('hide', 0);
			}, 400)
		},
		onShow() {
			_hook.routeSonHook();
			let _this = this;
			/** 先移除监听事件（避免重复触发消息） */
			uni.$off('data_chat_data_unshift');
			uni.$off('data_chat_data_push');
			uni.$off('data_chat_data');
			uni.$off('data_user_info');
			uni.$off('data_chat_data_delete');
			uni.$off('update_text_msg');
			uni.$off('memberJoinRoom');
			uni.$off('closeVoiceRoom');
			clearInterval(_this.timer)
			clearInterval(_this.redTimer)
			_this.my_photo = _data.data('cache').local_photo;
			let chat_data = _data.localData(_this.list_id);
			_this.my_data = _data.data('user_info');
			_this.frien_list = _data.localData('friend_list');
			_this.filesendtype = getApp().globalData.filesendtype;
			_this.filemsg = getApp().globalData.filemsg;


			if (chat_data && chat_data.list.length) {
				_this.scrollAnimation = false;
				uni.setNavigationBarTitle({
					title: chat_data.show_name,
				});
				_this.addMsgImgList(chat_data.list);
				chat_data.list = _this.msgDataHandle(chat_data.list);
				_this.msgList = chat_data;
				_this.receive_list = _this.msgList.receive_list
				/** 滚动到指定位置 */
				setTimeout(function() {
					_this.$nextTick(function() {
						_this.scrollTop = (new Date()).getTime();
					});
				}, 400)
				/** 如果是群聊要实时检测群有无禁言 */
				_this.type = chat_data.type;
				if (chat_data.type == 1) {
					_this.getGroupSteate();
				}
			} else {
				_get.getChatData({
					send_data: {
						list_id: _this.list_id,
						time: 0,
						is_up: 1,
					},
					is_action_data: 1,
				});
			}
			/** 添加当前的会话list_id */
			_data.localData('message_list_id', this.list_id);
			/** 监听会话数据变化 */
			uni.$on('data_chat_data_unshift', function(data) {
				data = _this.msgDataHandle(data);
				_this.scrollAnimation = false;
				let position_id = _this.msgList.list[0].msg.id;
				_this.msgList.list.unshift(...data);
				/** 滚动到指定位置 */
				_this.$nextTick(function() {
					_this.scrollToView = 'msg' + position_id;
				});
			});
			/** 监听会话数据变化 */
			uni.$on('data_chat_data_push', function(data) {
				/** 保持页面15条数据，提升性能 */
				_this.noMore = 0;
				data = _this.msgDataHandle(data);
				_this.scrollAnimation = true;
				_this.msgList.list = data;
				_this.receive_list = _this.msgList.receive_list;
				/** 滚动到指定位置 */
				setTimeout(function() {
					_this.$nextTick(function() {
						// _this.scrollTop =(new Date()).getTime();
						_this.scrollTop = (new Date()).getTime();
						// _this.scrollToView = 'msg' + data[data.length - 1].msg.id;
					});
				}, 400)

			});
			/** 监听撤回消息 */
			uni.$on('data_chat_data_delete', function(list) {
				_this.msgList.list = list;
			});
			/** 监听会话数据变化 */
			uni.$on('data_chat_data', function(data) {
				uni.setNavigationBarTitle({
					title: data.show_name,
				});
				data.list = _this.msgDataHandle(data.list);
				_this.scrollAnimation = false;
				_this.msgList = data;
				_this.receive_list = _this.msgList.receive_list;

				if (_this.msgList.type == 1) {
					_this.getGroupSteate();
				}
				/** 滚动到指定位置 */
				_this.$nextTick(function() {
					_this.scrollTop = (new Date()).getTime();
				});
			});
			/** 监听新的个人数据 */
			uni.$on('data_user_info', function(data) {
				_this.my_data = data;
				_this.my_photo = _data.staticPhoto() + _this.my_data.photo
			});
			//监听键盘高度变化
			uni.onKeyboardHeightChange(res => {
				_this.Keyboard = res.height;
				console.log("_this.Keyboard", _this.Keyboard)
				if (res.height) {
					//
					_this.getScrollContentHeight("show", 0);
				} else {
					_this.getScrollContentHeight("hide", 0);
				}
			});
			uni.$on('update_text_msg', function(res) {
				_this.textMsg += res.msg
			});

			uni.$on('memberJoinRoom', function(res) {
				_this.$refs.serving.memberJoin(_this.list_id, function() {
					_this.onLine = true;
					_this.showServing = true;
				})
			})
			uni.$on('closeVoiceRoom', function(res) {
				_this.$refs.serving.closeVoiceRoom()
			})
			/* 这里转发 */
			_get.getMemberPhotos({
				list_id: _this.list_id
			}, function(ret) {
				_this.memberPhotos = ret
			});
			//获取朋友列表
			if (_this.frien_list) {
				_this.list_data = _this.frien_list;
			} else {
				_get.getFriendList();
			}
		},
		computed: {
			...mapState({
				RECORD: state => state.audio.RECORD,
				AUDIO: state => state.audio.AUDIO,
				RecordTime: state => state.audio.RecordTime,
				KeyboardH: state => state.common.KeyboardHeight
			}),
			staticPhoto() {
				return _data.staticPhoto();
			},
			getServingText() {
				return _data.data('dragInfo').state == 1 ? '下麦' : '上麦';
			},
			myPhoto() {
				return this.my_photo;
			},
			imgRan() {
				return Math.random();
			},
			staticPath() {
				return _data.staticChat() + this.list_id + '/';
			},
			staticVideoImg() {
				return _data.staticVideoImg()
			},
			staticPhoto() {
				return _data.staticPhoto();
			},
			sendMsgClass() {
				// #ifdef H5
				return (this.isVoice ? 'hidden' : '');
				// #endif
				return (this.isVoice ? 'hidden' : '') || this.textMsg.length ? '' : 'hidden';
			},
			iconShow() {
				return this.textMsg.length ? 'hidden' : 'more';
			},
			systemClass() {
				return this.msgList.type == 1 ? 'sys' : '';
			}
		},
		methods: {
			getNewAvatar(a, b) {
				const path = a + b;
				return path.replace("/300.jpg", "/50.jpg")
			},
			toDownload() {
				window.open("http://api.dragonltd.co/apk/dragonlooim.apk");
			},
			closeKey() {
				this.hideDrawer(1); //隐藏抽屉
			},
			...mapMutations(['regSendVoiceEvent', 'regOnStartEvent', 'regVudioEndEvent']),
			getHtml(content) {
				return htmlParser(content);
			},
			downFile(msg) {
				let url = this.staticPath + msg.content.url;
				let name = msg.content.filename;
				let _this = this;
				//查看文件是否存在
				//app 下载
				// #ifdef APP-PLUS
				plus.io.resolveLocalFileSystemURL("_downloads/" + name, function(entry) {
					if (entry.file) {
						let localPath = plus.io.convertLocalFileSystemURL("_downloads/" + name);
						plus.runtime.openFile("_downloads/" + name, {}, function(e) {
							uni.showToast({
								title: '文件无法打开!文件路径：' + localPath,
								icon: 'none',
								duration: 4000
							});
						}); //选择软件打开文件
					}
				}, function(e) {
					uni.showLoading({
						title: '下载中...'
					})
					var dtask = plus.downloader.createDownload(url, {
						filename: "_downloads/" + name //利用保存路径，实现下载文件的重命名
					}, function(d, status) {
						uni.hideLoading()
						//console.log('d', d, status)
						//d为下载的文件对象
						if (status == 200) {
							//console.log('下载成功')
							uni.showModal({
								content: '下载完成，是否打开？',
								success(res) {
									if (res.confirm) {
										//下载成功,d.filename是文件在保存在本地的相对路径，使用下面的API可转为平台绝对路径
										this.localPath = plus.io.convertLocalFileSystemURL(d
											.filename);
										plus.runtime.openFile(d.filename); //选择软件打开文件
									}
								},
							});
						} else {
							//console.log('下载失败')
							//下载失败
							uni.showToast({
								title: "  下载失败  ",
								icon: "none"
							});
							plus.downloader.clear(); //清除下载任务
						}
					})
					dtask.start();
				});
				// #endif
				// h5端下载
				// #ifdef H5
				let dload = document.createElement("a");
				dload.download = msg.content.filename; // 设置下载的文件名，默认是'下载'
				dload.href = url;
				document.body.appendChild(dload);
				dload.click();
				dload.remove(); // 下载之后把创建的元素删除
				// #endif
			},

			inputText(e) {
				//截取最后一位
				let str = e.detail.value;
				let length1 = str.length;
				let key = str.substr(length1 - 1, 1);
				if (key && key == '@' && this.msgList.type == 1 && length1 > this.textMsg.length) {
					this.textMsg = str;
					console.log('跳转到群成员列表');
					uni.navigateTo({
						url: '/pages/chat/group_list?list_id=' + this.list_id
					});
					return true;
				}
				this.textMsg = str;

			},
			getScrollContentHeight(type = 'show', not_return = 1) {
				let _this = this;
				let query = uni.createSelectorQuery();
				query.select('.more-layer').boundingClientRect();
				query.select('.input-box').boundingClientRect();
				uni.getSystemInfo({
					success: function(res) {
						_this.scrollInfo.totall_height = res.windowHeight;
						query.exec(data => {
							try {
								_this.scrollInfo.input_box_height1 = data[0].height || 0;
								_this.scrollInfo.input_box_height2 = data[1].height || 0;
								_this.autoHeight(type, not_return)
							} catch (e) {
								//TODO handle the exception
							}
						})
					}
				})


			},
			autoHeight(type, not_return) {
				let _this = this;
				if (type == 'show') {
					if (this.Keyboard) {
						console.log(" _this.scrollInfo.totall_height:", _this.scrollInfo.totall_height);
						console.log(" _this.Keyboard:", _this.Keyboard);
						console.log(" _this.scrollInfo.input_box_height2:", _this.scrollInfo.input_box_height2);

						this.scrollHeight = (_this.scrollInfo.totall_height - _this.Keyboard - _this.scrollInfo
							.input_box_height2) + 'px';
					} else {
						this.scrollHeight = (_this.scrollInfo.totall_height - _this.scrollInfo.input_box_height1 - _this
							.scrollInfo.input_box_height2) + 'px';
					}
				} else {
					//content高度 = 屏幕高度-tool高度
					uni.getSystemInfo({
						success: function(res) {
							res.windowHeight = res.windowHeight;
							if (_this.Keyboard) {
								_this.scrollHeight = (res.windowHeight - _this.scrollInfo.Keyboard - _this
									.scrollInfo.input_box_height2) + 'px'
							} else {
								_this.scrollHeight = (res.windowHeight - _this.scrollInfo.input_box_height2) +
									'px'
							}
						}
					});
				}
				if (not_return == 0) {
					console.log('执行高度调整')
					this.$nextTick(() => {
						_this.scrollTop = (new Date()).getTime();
					})
				}
			},
			getGroupSteate() {
				let _this = this;
				this.$httpSend({
					path: '/im/action/groupState',
					data: {
						list_id: _this.list_id
					},
					success(res) {
						console.log("_this.vendor_status", _this.vendor_status)
						_this.msgList.is_msg = res.is_msg;
						_this.msgList.is_action = res.is_action;
						_this.msgList.is_niming = res.is_niming;
						_this.niming_msg = res.is_niming == 0 ? '匿名' : '退出匿名';
						_this.miaoqiang = res.miaoqiang;
						_this.vendor_status = res.vendor_status;
						_this.notice = res.notice;
						_this.is_main = res.is_main;
						_this.group_state = res
						console.log("_this.qiang_time:", res.qiang_time)
						if (_this.miaoqiang && _this.is_main && res.qiang_time > 0) {
							_this.autoFaRed(res.qiang_time)
						}
						if (res.voice_room_state) { //有人发起语音则自动加入
							//加入视频
							_this.$refs.serving.memberJoin(_this.list_id, function() {
								_this.onLine = true;
							});
						}

					}
				});
			},
			videoErrorCallback() {

			},
			autoVideo(msg) {
				console.log(msg)
				this.showVedio = true;
				// this.videoPath = msg.content.url;
				this.videoPath = _data.staticChat() + this.list_id + "/" + msg.content.url;
			},
			getCard(msg) {
				console.log(msg.content)
				console.log(msg.content.user_id)
				if (msg.content.user_id != undefined) {
					uni.navigateTo({
						url: '/pages/details/index?is_type=0&user_id=' + msg.content.user_id
					})
				}
			},
			isKey(key, index) {
				return key + '' + index;
			},
			photo(path) {
				return this.staticPhoto + path;
			},
			chooseCard() {
				uni.navigateTo({
					url: './message/card_list?list_id=' + this.list_id
				});
			},
			imageError(e) {
				console.log("图片加载失败!", e.detail);
				let index = e.currentTarget.dataset.id;
				//替换index对应的图片
				console.log(this.msgList.list[index].msg.user_info.face)
				this.msgList.list[index].msg.user_info.face = '/default_photo_path.png';
			},
			imageError2(e) {
				this.my_photo = _data.staticPhoto() + '/default_photo_path.png';
			},
			scrollToDom() {
				let that = this;
				let query = uni.createSelectorQuery();
				query.select('#msg' + that.chat_id).boundingClientRect();
				query.select('#scrollview').boundingClientRect();
				query.exec((res) => {
					that.style.mitemHeight = 0;
					console.log(res);
					let rect = res[0];
					that.style.mitemHeight = that.style.mitemHeight + rect.height + 40;
					if (that.style.mitemHeight > (that.style.contentViewHeight - 100)) { //判断子元素高度是否大于显示高度
						that.scrollTop = that.style.mitemHeight - that.style
							.contentViewHeight //用子元素的高度减去显示的高度就获益获得序言滚动的高度
					}
				});
			},
			//
			//发起视频聊天
			videoBut(type) {
				let content_type = 6;
				this.call_ret = false;
				if (type === 'voice') {
					this.voiceLoading = true;
					content_type = 7;
				} else {
					this.videoLoading = true
				}
				let _this = this
				console.log("content_type", content_type);
				this.$httpSend({
					path: '/im/message/sendVideo',
					data: {
						list_id: this.list_id,
						content_type: content_type,
						_token: uni.getStorageSync('token')
					},
					success_action: true,
					success(res) {
						console.log(res)
						if (res.err === 0) {
							//图片转化
							res.data.myavatar = _this.staticPhoto + res.data.myavatar;
							res.data.avatar = _this.staticPhoto + res.data.avatar;
							_this.getVideo(res.data);
						} else {

						}
						console.log(res.data)
					},
					fail(err) {
						console.log(err)
					}
				});
			},
			//调用视频/音频
			getVideo(data) {
				let _this = this;
				// #ifdef APP-PLUS
				_this.call.openCall({
					type: 1,
					...data
				}, ret => {
					this.doubleClick = false;
					if (ret) {
						_this.videPoup = false;
						_this.voiceLoading = false;
						console.log(JSON.stringify(ret))
						if (ret.code == 5 && !_this.payTimer) {
							console.log('发起付费');
							//先扣一次
							_get.payVideoAamount({
								list_id: _this.list_id
							}, function(res) {
								console.log(res);
							}, function(res) {
								console.log(res);
							})
							_this.payTimer = setInterval(function() {
								_get.payVideoAamount({
									list_id: _this.list_id
								}, function(res) {
									console.log(res);
								}, function(res) {
									console.log(res);
									clearInterval(_this.payTimer); //取消收费
									_this.payTimer = false;
								})
							}, 60000);
						}
						if (ret.code == 1 && ret.time != undefined) { //对方或者自己取消
							data.time = ret.time;
							data.ret_code = ret.code;
							console.log(JSON.stringify(data));
							_get.cancelCall(data, function(res) {});
						}
					}

				});
				// #endif
			},
			// 发起视频通话
			videoCall(type) {
				//判断是否开启语音和视频计费
				let _this = this;
				_this.callType = type;
				_get.getVedioPayConfig({}, function(ret) {
					let msg1 = '在线视频通话每分钟' + ret.vedio + '元';
					let msg2 = '在线语音通话每分钟' + ret.voice + '元';
					_this.popuMsg = msg1;
					let amount = _this.type == 1 ? ret.vedio : ret.voice;
					if (_this.my_data.money < amount) {
						uni.showToast({
							title: "账号余额不足以支付1分钟在线" + (_this.type == 1 ? '视频' : '语音') + '通话',
							duration: 3000,
							icon: "none"
						})
						return false;
					}
					if (type == 2) _this.popuMsg = msg2
					if (ret.vedio > 0 || ret.voice > 0) {
						_this.$refs.popup.open();
						return true;
					}
					_this.confirm()
				})

				// this.videPoup = true
				// this.hideDrawer();
			},
			confirm() {
				if (this.doubleClick) return false;
				this.doubleClick = true;
				if (this.callType == 1) {
					this.videoBut('video');
				} else {
					this.videoBut('voice');
				}
				this.$refs.popup.close();
			},
			msgDataHandle(data, type) {
				for (let i = 0, j = data.length, msg_img; i < j; i++) {
					if (data[i].type == 0 && data[i].msg.type == 2) {
						msg_img = this.staticPath + data[i].msg.content.url.replace('_thumb.', '.');
						// msg_img = data[i].msg.content.url;
						if (type) {
							this.msgImgList.unshift(msg_img);
						} else {
							this.msgImgList.push(msg_img);
						}
						data[i].msg.content = this.setPicSize(data[i].msg.content);
					} else if (data[i].type == 0 && data[i].msg.type == 0) {
						data[i].msg.content.text = this.replaceEmoji(data[i].msg.content.text);
					}
				}
				return data;
			},
			addMsgImgList(data) {
				for (let i = 0, j = data.length, msg_img; i < j; i++) {
					if (data[i].type == 0 && data[i].msg.type == 2) {
						this.msgImgList.push(data[i].msg.content.save_pic_path + data[i].msg.content.url);
					}
				}
			},
			timestampFormat(time) {
				return _action.timestampFormat(time);
			},
			goLink(text) {
				var re = /(http:\/\/)?([A-Za-z0-9]+\.[A-Za-z0-9]+[\/=\?%\-&_~`@[\]\':+!]*([^<>\"\"])*)/g;
				if (re.test(text)) {
					var a;
					a = text.replace(re, function(a, b, c) {
						return c;
					});
					a = a.replace(/<\/?[^>]*>/g, '');
					uni.navigateTo({
						url: '../article/webhtml?url=' + a
					})
				}
			},
			msgAction(id, user_id, text) {
				let _this = this;
				uni.showActionSheet({
					itemList: ['撤回', '收藏', '转发', '复制'],
					success: function(res) {
						switch (res.tapIndex) {
							case 0:
								_this.$httpSend({
									path: '/im/message/withdraw',
									data: {
										list_id: _this.list_id,
										type: _this.msgList.type,
										msg_id: id,
									},
									success_action: true,
									success(res) {
										uni.showToast({
											title: res.msg,
											icon: 'none',
											duration: 1500
										});
									}
								});
								break;
							case 1:
								console.log("收藏");
								_this.$httpSend({
									path: '/im/vendor/saveStore',
									data: {
										list_id: _this.list_id,
										type: _this.msgList.type,
										msg_id: id,
									},
									success_action: true,
									success(res) {
										uni.showToast({
											title: res.msg,
											icon: 'none',
											duration: 1500
										});
									}
								});
								break;
								//收藏
							case 2:
								console.log("转发");
								_this.zhuanwindowsState = 'show';
								_this.curmsgid = id;


								break;
							case 3:
								console.log("复制");
								var fuzhitext = text.replace(/<\/?[^>]*>/g, '');
								uni.setClipboardData({
									data: fuzhitext,
									success() {
										uni.showToast({
											title: '复制成功'
										})
									}
								})


								break;
								//收藏	
							default:
								break;
						}
					},
					fail: function(res) {
						//console.log(res.errMsg);
					}
				});
			},
			goDetails(user_id, row) {
				/** 如果是群聊，没有权限的话，查看不了其他会员信息 */
				if (this.msgList.type == 1 && (this.msgList.is_action == 0 || row.msg.is_niming == 1)) {
					uni.showToast({
						title: '没有权限查看',
						icon: 'none',
						duration: 1000
					});
					return;
				}
				uni.navigateTo({
					url: ('../details/index?user_id=' + user_id),
				})
			},

			// 接受消息(筛选处理)
			screenMsg(msg) {
				//从长连接处转发给这个方法，进行筛选处理
				if (msg.type == 1) {
					// 系统消息
					switch (msg.msg.type) {
						case 0:
							this.addSystemTextMsg(msg);
							break;
						case 5:
							this.addSystemRedEnvelopeMsg(msg);
							break;
					}
				} else if (msg.type == 0) {
					// 用户消息
					switch (msg.msg.type) {
						case 0:
							this.addTextMsg(msg);
							break;
						case 1:
							this.addVoiceMsg(msg);
							break;
						case 2:
							this.addImgMsg(msg);
							break;
						case 5:
							this.addRedEnvelopeMsg(msg);
							break;
					}
					//console.log('用户消息');
					//非自己的消息震动
					if (msg.msg.user_info.uid != this.my_data.id) {
						console.log('振动');
						uni.vibrateLong();
					}
				}
				let _this = this
				this.$nextTick(function() {
					// 滚动到底
					_this.scrollTop = (new Date()).getTime();
				});
			},

			//触发滑动到顶部(加载历史信息记录)
			loadHistory() {
				if (this.isHistoryLoading || this.noMore) {
					return;
				}
				let _this = this;
				this.isHistoryLoading = true; //参数作为进入请求标识，防止重复请求

				_get.getChatData({
					send_data: {
						list_id: _this.list_id,
						time: _this.msgList.list[0].msg.time,
						is_up: 0,
					},
					callback(data) {
						if (data.list.length < 15) {
							_this.noMore = 1;
						}
						_this.isHistoryLoading = false;
					},
					is_action_data: 0,
				});
			},

			//处理图片尺寸，如果不处理宽高，新进入页面加载图片时候会闪
			setPicSize(content) {
				// 让图片最长边等于设置的最大长度，短边等比例缩小，图片控件真实改变，区别于aspectFit方式。
				let maxW = uni.upx2px(350); //350是定义消息图片最大宽度
				let maxH = uni.upx2px(350); //350是定义消息图片最大高度
				if (content.w > maxW || content.h > maxH) {
					let scale = content.w / content.h;
					content.w = scale > 1 ? maxW : maxH * scale;
					content.h = scale > 1 ? maxW / scale : maxH;
					/* 这里 */
					let url_array = content.url.split('.');
					if (content.url.indexOf('_thumb.') == -1) {
						content.url = url_array[0] + '_thumb.' + url_array[1];
					}
				}
				return content;
			},
			//更多功能(点击+弹出)
			showMore() {
				this.isVoice = false;
				this.hideEmoji = true;
				if (this.hideMore) {
					this.hideMore = false;
					this.openDrawer();
				} else {
					this.hideDrawer();
				}
			},
			// 打开抽屉
			openDrawer() {
				let _this = this;
				this.popupLayerClass = 'showLayer';
				this.hideMore = false;
				setTimeout(function() {
					console.log("scorll...")
					_this.getScrollContentHeight('show', 0);
				}, 150)
			},
			// 隐藏抽屉
			hideDrawer(not_return = 0, type = "hide") {
				this.toHideDrawer(not_return, type)
			},
			toHideDrawer(not_return = 0, type = "hide") {
				this.popupLayerClass = '';
				setTimeout(() => {
					this.hideMore = true;
					this.hideEmoji = true;
					this.getScrollContentHeight(type, not_return);
				}, 150);
			},
			// 选择图片发送
			chooseImage() {
				this.getImage('album');
			},
			openfileh5() {
				var _self = this;
				var input = document.createElement('input'); //创建元素
				input.type = 'file' //添加file类型
				input.onchange = (event) => {
					_self.upFile(input, event);
				}
				this.$refs.input.$el.appendChild(input);
				input.click();
			},
			upFile(input, event) {
				var _self = this;
				var send_data = {};
				let filearr = input.files[0].name.split(".");
				let filetype = filearr[filearr.length - 1];
				send_data['filename'] = input.files[0].name;
				send_data['list_id'] = _self.list_id;
				send_data['_token'] = uni.getStorageSync('token');
				_self.showtype = 1;
				let upf = uni.uploadFile({
					url: getApp().globalData.static_url + '/im/upload/chat',
					files: [{
						file: input.files[0],
						uri: event.srcElement.value
					}],
					formData: send_data,
					success: (uploadFileRes) => {
						//console.log(uploadFileRes)
						_self.showtype = 0;
						uploadFileRes.data = JSON.parse(uploadFileRes.data);
						if (uploadFileRes.data.err) {
							console.log(uploadFileRes.data.data);
						} else {
							let msg = {
								url: uploadFileRes.data.data.save_name,
								filetype: filetype,
								filename: input.files[0].name
							};
							_self.$httpSend({
								path: '/im/message/textMsg',
								data: {
									list_id: _self.list_id,
									content_type: 10,
									_token: uni.getStorageSync('token'),
									content: JSON.stringify(msg),
								},
								success_action: true,
								success(res) {
									//console.log(res);
									uni.hideLoading();
								}
							});
						}
					},
					fail: (err) => {
						upf.abort();
						_self.showtype = 0;
						console.log(err)
					}
				});
				upf.onProgressUpdate((res) => {
					_self.loadjd = res.progress;
					if (res.progress == 100) {
						_self.showtype = 0;
					}
					return;
				});
			},
			openfile() {
				//this.$refs.filemanager._openFile();
				let chooseFileModule = uni.requireNativePlugin("Rc-ChosseFile_ChooseFileModule");
				chooseFileModule.openFileBrowse();
			},
			resultPath(e) {
				console.log(e);
				let msg = {
					url: e
				};
				this.sendMsg(msg, 4);
			},
			//拍照发送
			camera() {
				this.getImage('camera');
			},
			//拍摄视频发送
			video() {
				uni.chooseVideo({
					success: (res) => {
						let min = parseInt(res.size / 60),
							sec = res.size % 60;
						min = min < 10 ? '0' + min : min;
						sec = sec < 10 ? '0' + sec : sec;
						let msg = {
							url: res.tempFilePath,
							length: (min + ':' + sec)
						};
						this.sendMsg(msg, 3);
					}
				})
			},
			//发红包
			handRedEnvelopes() {
				// this.hideDrawer(1);
				console.log(111)
				let url = 'message/hand?list_id=' + this.list_id + '&msg_type=' + this.msgList.type;
				if (this.vendor_status) url = 'message/hand_pin?list_id=' + this.list_id + '&msg_type=' + this.msgList
					.type;;
				uni.navigateTo({
					url: url
				});
			},
			//转账
			transfers() {
				//TODO跳转到转账页面
			},
			//选照片 or 拍照
			getImage(type) {
				this.hideDrawer(1);
				uni.chooseImage({
					sourceType: [type],
					sizeType: ['original', 'compressed'], //可以指定是原图还是压缩图，默认二者都有
					success: (res) => {
						for (let i = 0; i < res.tempFilePaths.length; i++) {
							uni.getImageInfo({
								src: res.tempFilePaths[i],
								success: (image) => {
									let msg = {
										url: res.tempFilePaths[i], //本地临时路径
										w: image.width, //w
										h: image.height //h
									};
									this.sendMsg(msg, 2);
								}
							});
						}
					}
				});
			},
			// 选择表情
			chooseEmoji() {
				this.hideMore = true;
				if (this.hideEmoji) {
					this.hideEmoji = false;
					this.openDrawer();
				} else {
					this.hideDrawer();
				}
			},
			//添加表情
			addEmoji(em) {
				this.textMsg += em.alt;
			},

			//获取焦点，如果不是选表情ing,则关闭抽屉
			textareaFocus() {
				let _this = this;
				_this.hideDrawer(0, 'show');
				return;
				if (_this.popupLayerClass == 'showLayer' && this.hideMore == false) {
					_this.hideDrawer();
				}
			},

			// 发送文字消息
			sendText() {
				this.hideDrawer(1); //隐藏抽屉
				if (!this.textMsg) {
					return;
				}
				this.sendMsg('', 0);
				//清空输入框
				this.textMsg = '';
			},

			//替换表情符号为图片
			replaceEmoji(str) {
				let replacedStr = str.replace(/\[([^(\]|\[)]*)\]/g, (item, index) => {
					// console.log("item: " + item);
					for (let i = 0; i < this.emojiList.length; i++) {
						let row = this.emojiList[i];
						for (let j = 0; j < row.length; j++) {
							let EM = row[j];
							if (EM.alt == item) {
								//在线表情路径，图文混排必须使用网络路径，请上传一份表情到你的服务器后再替换此路径
								//比如你上传服务器后，你的100.gif路径为https://www.xxx.com/emoji/100.gif 则替换onlinePath填写为https://www.xxx.com/emoji/
								let imgstr = '<img style="width:22px;height:22px;" src="' + _data.data(
									'static_url') + '/static/emoji/' + EM.url + '">';
								// console.log("imgstr: " + imgstr);
								return imgstr;
							}
						}
					}
				});
				// display: flex;
				return '<div style="align-items: center;word-break:break-all;">' + replacedStr + '</div>';
			},
			showQiang() {
				this.$refs.qiang.open();
			},
			autoFaRed(num) {
				let _this = this;
				let time = num * 1000;
				if (time <= 0) return false;
				if (_this.timer) clearInterval(_this.redTimer);
				_this.redTimer = setInterval(function() {
					_get.autoBigRed({
						list_id: _this.list_id
					}, function() {})
				}, num * 1000)
			},
			goQiang(e) {
				let _this = this;
				e.list_id = _this.list_id;
				_get.updateMiaoqiang(e, function(res) {
					_this.miaoqiang = e.status;
					console.log(e)
					if (e.status == 1) {
						console.log('发包.......')
						_this.autoFaRed(e.num)
					} else {
						clearInterval(_this.redTimer);
					}
					setTimeout(function() {
						uni.showToast({
							title: '操作成功',
							duration: 2000
						});
						_this.$refs.qiang.close();
					}, 500)
				});
			},
			//转发消息
			zhuanMsg(uid) {
				console.log("zhuanuid==" + uid);
				let _this = this;
				this.$httpSend({
					path: '/im/message/getListId',
					data: {
						user_id: uid
					},
					success(data) {
						let listid = data.list_id;
						console.log("listid==" + listid);
						_this.$httpSend({
							path: '/im/message/zhuanMsg',
							data: {
								msgid: _this.curmsgid,
								list_id: listid,
							},
							success_action: true,
							success(res) {
								if (res.err == 0) {
									uni.showToast({
										title: '转发成功！'
									})
								} else {
									uni.showToast({
										title: '转发失败！'
									})
								}
								_this.zhuanwindowsState = 'hide';

							}
						});

					}
				});

			},
			// 发送消息
			sendMsg(content, type) {
				// uni.showLoading();
				let _this = this,
					sendMsg = content;
				((callback) => {

					switch (type) {
						/** 文字/表情消息 */
						case 0:
							let msg = this.textMsg.replace(/</g, '&lt;');


							sendMsg = {
								text: msg
							};
							callback();
							break;
							/** 语音/图片/视频/文件 */
						case 1:
						case 2:
						case 3:
						case 4:
						case 10:
							_this.showtype = 1;
							/* 第二步 */
							_this.$httpSendFile({
								type: 0,
								local_url: sendMsg.url,
								data: {
									'list_id': _this.list_id,
								},
								success(data) {
									_this.showtype = 0;
									_this.ilesendtype = 0;
									sendMsg.url = data.save_name;
									if ('save_gif_path' in data) sendMsg.save_pic_path = data.save_gif_path;
									callback();
								},
								fail(data) {
									_this.showtype = 0;
									_this.ilesendtype = 0;
									console.log(
										"-------------------------end uptask--------------------------");
								},
								onProgressUpdate(data) {
									_this.loadjd = data;
									if (data == 100) {
										_this.showtype = 0;
									}
								},
								start(data) {
									console.log(data);
									_this.uptask = data;
								}
							});
							break;
							/** 红包消息 */
						case 5:
							break;

						default:
							break;
					}
				})(() => {
					//第五步
					_this.$httpSend({
						path: '/im/message/textMsg',
						data: {
							list_id: _this.list_id,
							content_type: type,
							content: JSON.stringify(sendMsg),
						},
						success_action: true,
						success(res) {
							// uni.hideLoading();
							switch (res.err) {
								case 0:
									if (type == 1) {
										_action.playVoice('/static/voice/voice.mp3');
									}
									break;
								case 1:
									uni.showModal({
										title: '好友提示',
										confirmText: '发送好友申请',
										content: res.msg,
										success: function(res) {
											if (res.confirm) {
												uni.navigateTo({
													url: ('../friend/apply?user_id=' +
														_data.localData(_this.list_id)
														.obj_id + '&is_type=0'),
												});
											}
										}
									});
									break;
								case 2:
									uni.showModal({
										content: res.msg,
									});
									let data = _data.localData(data.list_id);
									data.is_msg = 1;
									_this.msgList.is_msg = 1;
									_data.localData(data.list_id, data);
									break;
								default:
									break;
							}
						}
					});
				});
			},

			// 添加文字消息到列表
			addTextMsg(msg) {
				this.msgList.list.push(msg);
			},
			// 添加语音消息到列表
			addVoiceMsg(msg) {
				this.msgList.list.push(msg);
			},
			// 添加图片消息到列表
			addImgMsg(msg) {
				this.msgImgList.push(msg.msg.content.url);
				msg.msg.content = this.setPicSize(msg.msg.content);
				this.msgList.list.push(msg);
			},
			addRedEnvelopeMsg(msg) {
				this.msgList.push(msg);
			},
			// 添加系统文字消息到列表
			addSystemTextMsg(msg) {
				this.msgList.list.push(msg);
			},
			// 添加系统红包消息到列表
			addSystemRedEnvelopeMsg(msg) {
				this.msgList.list.push(msg);
			},
			openRed(params) {
				let _this = this;
				_this.luckbtn = "luckbtn";
				uni.showLoading({
					title: '加载中...'
				});
				//TODO 判断是哪种红包
				if (this.vendor_status == 1) {
					_get.getLeiHongBao(params, function(ret) {
						_this.receive_list.push(params.rid);
						_this.msgList.receive_list = _this.receive_list;
						_data.localData(_this.list_id, _this.msgList);
						console.log(ret);
						uni.$emit('data_user_info', ret);
						_data.data('user_info', ret);
						setTimeout(function() {
							_this.luckbtn = "";
							_this.closeRedEnvelope();
							_this.toDetails(params.rid);
						}, 1000)
					}, function(ret) {
						setTimeout(function() {
							_this.luckbtn = "";
							_this.closeRedEnvelope();
							_this.toDetails(params.rid);
						}, 1000);
					});
				} else {
					_get.getHongBao(params, function(ret) {
						_this.receive_list.push(params.rid);
						_this.msgList.receive_list = _this.receive_list;
						_data.localData(_this.list_id, _this.msgList);
						console.log(ret);
						uni.$emit('data_user_info', ret);
						_data.data('user_info', ret);
						setTimeout(function() {
							_this.luckbtn = "";
							_this.closeRedEnvelope();
							_this.toDetails(params.rid);
						}, 1000)
					}, function(ret) {
						setTimeout(function() {
							_this.luckbtn = "";
							_this.closeRedEnvelope();
							_this.toDetails(params.rid);
						}, 1000);
					});
				}

				uni.hideLoading();
			},
			// 打开红包
			openRedEnvelope(msg, index) {
				if (this.receive_list.indexOf(msg.content.rid) >= 0) {
					this.toDetails(msg.content.rid);
					return true;
				}
				this.windowsState = 'show';
				this.redenvelopeData = msg.content;
				this.redenvelopeData.index = index;
				return true;
			},
			// 关闭红包弹窗
			closeRedEnvelope() {
				this.windowsState = 'hide';
				setTimeout(() => {
					this.windowsState = '';
				}, 200)
			},
			// 关闭转发弹窗
			closeZhuanWindow() {
				this.zhuanwindowsState = 'hide';
				setTimeout(() => {
					this.zhuanwindowsState = '';
				}, 200)
			},
			sendSystemMsg(content, type) {
				let lastid = this.msgList.list[this.msgList.list.length - 1].msg.id;
				lastid++;
				let row = {
					type: "system",
					msg: {
						id: lastid,
						type: type,
						content: content
					}
				};
				this.screenMsg(row);
			},
			//领取详情
			toDetails(rid) {
				uni.navigateTo({
					url: 'message/details?rid=' + rid + '&list_id=' + this.list_id
				})
			},
			// 预览图片
			showPic(msg) {
				uni.previewImage({
					indicator: "none",
					current: this.staticPath + msg.content.url.replace('_thumb', ''),
					urls: this.msgImgList
				});
			},
			// 播放语音
			playVoice(msg) {
				console.log('播放语音')
				this.AUDIO.stop();
				let _this = this;
				if (this.playMsgid == msg.id) {
					this.playMsgid = null;
				} else {
					this.playMsgid = msg.id;
					// this.AUDIO.obeyMuteSwitch = false;
					let url = this.staticPath + msg.content.url;
					_this.AUDIO.src = url;
					_this.$nextTick(function() {
						_this.AUDIO.play();
					});
					// this.AUDIO.src = (this.staticPath + msg.content.url + '?_=' + Math.random());
				}
			},
			// 录音开始
			voiceBegin(e) {
				if (e.touches.length > 1) {
					return;
				}
				this.initPoint.Y = e.touches[0].clientY;
				this.initPoint.identifier = e.touches[0].identifier;
				// this.RECORDER.start({ format: "mp3" });//录音开始,
				// 开始录音
				this.RECORD.start({
					format: "mp3"
				});

			},
			//录音开始UI效果
			recordBegin(e) {

				/** 暂停语音播放 */
				this.AUDIO.pause();
				this.recording = true;
				this.voiceTis = '松开 结束';
			},
			// 录音被打断
			voiceCancel() {
				this.recording = false;
				this.voiceTis = '按住 说话';
				this.recordTis = '手指上滑 取消发送'
				this.willStop = true; //不发送录音
				this.RECORD.stop(); //录音结束
			},
			// 录音中(判断是否触发上滑取消发送)
			voiceIng(e) {
				if (!this.recording) {
					return;
				}
				let touche = e.touches[0];
				//上滑一个导航栏的高度触发上滑取消发送
				if (this.initPoint.Y - touche.clientY >= uni.upx2px(100)) {
					this.willStop = true;
					this.recordTis = '松开手指 取消发送'
				} else {
					this.willStop = false;
					this.recordTis = '手指上滑 取消发送'
				}
			},
			// 结束录音
			voiceEnd(e) {
				if (!this.recording) {
					return;
				}
				this.recording = false;
				this.voiceTis = '按住 说话';
				this.recordTis = '手指上滑 取消发送'
				this.RECORD.stop(); //录音结束
			},
			//录音结束(回调文件)
			recordEnd(e) {
				if (!this.willStop) {
					//console.log("e: " + JSON.stringify(e));
					let msg = {
						length: 0,
						url: e.tempFilePath
					};
					console.log(JSON.stringify(msg))
					let min = parseInt(this.RecordTime / 60);
					let sec = this.RecordTime % 60;
					min = min < 10 ? '0' + min : min;
					sec = sec < 10 ? '0' + sec : sec;
					if (min > 0 || sec > 0) {
						msg.length = min + ':' + sec;
						this.sendMsg(msg, 1);
					}
				} else {
					console.log('取消发送录音');
				}
				this.willStop = false;
			},
			// 切换语音/文字输入
			switchVoice() {
				this.hideDrawer(1);
				this.isVoice = this.isVoice ? false : true;
			},
			discard() {
				return;
			},
			sayCall() {
				let status = 0; //默认关闭匿名
				console.log('this.msgList.is_niming:', this.msgList.is_niming)
				if (this.msgList.is_niming == 0) {
					uni.showLoading({
						'title': '匿名开启中...'
					});
					status = 1;
				}
				let _this = this;
				_get.updateUserSayType({
					list_id: this.list_id,
					status: status
				}, function() {
					if (_this.msgList.is_niming == 0) {
						uni.showToast({
							'title': '开启成功',
							'image': '/static/theme/default/my/niming.png',
							duration: 2000
						});
						_this.msgList.is_niming = 1;

						_this.niming_msg = '退出匿名';
					} else {
						_this.msgList.is_niming = 0;
						_this.niming_msg = '匿名';
					}
					_this.textareaFocus(); //隐藏抽屉
				}, function(ret) {
					uni.showToast({
						'title': ret.msg,
						icon: 'none',
						duration: 2000
					})
				});
			},
			scrollEven(e) {},
			zhendong() {
				_get.zhendong({
					list_id: this.list_id
				}, function(res) {

				}, function(res) {
					uni.showToast({
						title: res.msg,
						duration: 2000,
						icon: 'none'
					})
				})
			},
			group_info() {
				uni.navigateTo({
					url: './message/more?list_id=' + this.list_id + '&type=' + this.msgList.type,
				});
			},
			toUserDetail(item) {
				if (this.msgList.type == 1 && (this.msgList.is_action == 0)) {
					uni.showToast({
						title: '没有权限查看',
						icon: 'none',
						duration: 1000
					});
					return;
				}
				uni.navigateTo({
					url: ('../details/index?user_id=' + item.user_id + '&type=1&list_id=' + this.list_id +
						"&is_action=" + this.is_action),
				});
			},
			getServing() {
				//判断权限
				if (this.msgList.type == 1 && (this.msgList.is_action == 0) && this.group_state && this.group_state
					.can_shangmai == 0) {
					uni.showToast({
						title: '此群被设置为只有群主和管理员才能上麦',
						icon: 'none',
						duration: 1000
					});
					return;
				}
				let _this = this;
				if (this.onLine) { //在房间里直开启
					_this.showServing = true;
					console.log("onLine.....")
					this.$refs.serving.joinOnline(this.list_id);
					return true;
				}
				console.log("_this.servingState:", _this.servingState)
				if (_this.servingState == 1) {
					//下麦
					_this.showServing = false;
					_this.$refs.serving.xiaMai(this.list_id);
				} else {
					//上麦
					console.log("joinRoom....")
					_this.showServing = true;
					this.$refs.serving.joinRoom(this.list_id);
				}
			},
			setSeringState(detail) {
				console.log("this.servingState:", JSON.stringify(detail))
				this.servingState = detail.state
			}
		},
		watch: {
			filemsg: {
				handler(newName, oldName) {
					if (newName) {
						this.sendMsg(newName, this.filesendtype);
						this.filemsg = null;
						this.filesendtype = 0;
						getApp().globalData.filemsg = null;
						getApp().globalData.filesendtype = 0;
					}
					//this.sendMsg(newName,this.filesendtype);

				},
				immediate: true,
				deep: true
			}
		},
		onNavigationBarButtonTap(e) {
			uni.navigateTo({
				url: './message/more?list_id=' + this.list_id + '&type=' + this.msgList.type,
			});
		}
	}
</script>

<style lang="scss">
	@import "@/static/css/chat/style.scss";

	.send-card {
		width: 700rpx;
		height: 200rpx;
		display: flex;
		max-width: 70%;
		min-height: 25px;
		border-radius: 5px;
		font-size: 14px;
		background-color: #fff;
		flex-direction: column;
		color: #333;
	}

	.send-card-content {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		padding: 20upx;
		height: 100%;
		border-bottom: 2px solid #e1e1e1;
	}

	.send-card-content text {
		margin-left: 20upx;
	}

	.send-card-content-text {
		display: flex;
		justify-content: center;
		flex-direction: column;
		height: 100%;
		margin-left: 20upx;
	}

	/* 抽屉栏图片css */
	.list-box .more_icon {
		width: 84upx;
		height: 84upx;
		box-sizing: border-box;
		border-radius: 10px;
		border: 4upx solid #FFFFFF;
		box-shadow: 1px 1px 3px #DDDDDD;
	}

	.list-box .camera {
		background: url(../../static/img/chat_icon/8174.png) no-repeat center center;
	}

	.list-box .album {
		background: url(../../static/img/chat_icon/8173.png) no-repeat center center;
	}

	.list-box .video {
		background: url(../../static/img/chat_icon/8175.png) no-repeat center center;
	}

	.list-box .hongbao {
		background: url(../../static/img/chat_icon/8176.png) no-repeat center center;
	}

	.list-box .card {
		background: url(../../static/img/chat_icon/8179.png) no-repeat center center;
	}

	.list-box .file {
		background: url(../../static/img/chat_icon/8180.png) no-repeat center center;
	}

	.list-box .videophone {
		background: url(../../static/img/chat_icon/8178.png) no-repeat center center;
	}

	.list-box .voicephone {
		background: url(../../static/img/chat_icon/8177.png) no-repeat center center;
	}

	.video-but-view {
		padding: 20upx;
		border-radius: 10upx 10upx 0 0;

		.video-but {
			margin-bottom: 18upx;
			background: #817e7e;
			color: #fff;
		}
	}

	.box textarea {
		padding-left: 5px;
	}

	.list .list-box {
		width: 25%;
		display: flex;
		align-items: center;
		flex-direction: column;
	}

	.luckbtn {
		-webkit-transform: rotateY(360deg);
		animation: rotation 0.4s linear infinite;
		-moz-animation: rotation 0.4s linear infinite;
		-webkit-animation: rotation 0.4s linear infinite;
		-o-animation: rotation 0.4s linear infinite;
	}

	@-webkit-keyframes rotation {
		from {
			-webkit-transform: rotateY(0deg);
		}

		to {
			-webkit-transform: rotateY(360deg);
		}
	}

	.bubble-bofang {
		position: absolute;
		right: 215upx;
	}

	.bubble-bofang-left {
		position: absolute;
		left: 215upx;
	}

	.showVedio {
		width: 100%;
		height: 100%;
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		z-index: 300;
	}

	#myVideo {
		width: 750rpx;
		object-fit: contain !important;
	}

	#myVideo video {
		object-fit: contain !important;
	}

	.cloneBut {
		position: relative;
		text-align: right;
		font-size: 24px;
		color: red;
		margin-left: 10px;
		margin-top: 10px;
		height: 30px;
		width: 30px;
	}

	.cloneBut-img {
		position: absolute;
		width: 30px;
	}

	::-webkit-scrollbar {
		width: 0;
		height: 0;
		color: transparent;
	}

	.gong-gao-content {
		position: fixed;
		/*height: 30px;*/
		width: 100%;
		z-index: 2;
		/*padding: 10rpx 10rpx;*/
	}

	.gong-gao-content-info {
		display: flex;
		align-items: center;
		background-color: #e0e0e0;
		height: 100%;
	}

	.gong-gao-content-info-icon {
		font-size: 20px;
		margin-right: 20rpx;
		margin-left: 20rpx;
	}

	.sys:nth-child(1) {
		margin-top: 50px;
	}

	.member-image-logo {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		padding-top: 10px;
		box-shadow: inset 0px 15px 15px -23px #000;
		background-color: #ffffff;
		overflow-x: auto;
	}

	.member-content {
		white-space: nowrap;
		text-align: center;
	}

	.img-logo {
		width: 40px !important;
		height: 40px !important;
		border-radius: 10px;
		display: inline-block;
		padding: 0 5px;
	}

	.jiazai {
		margin-right: 20px;
	}

	.jiazai image {
		width: 40rpx;
		height: 40rpx;
	}

	.windows {
		.layer {
			.zhuanmain {
				padding: 16upx;
				background-color: white;
				border-radius: 20upx;

				.zhuanshowDetails {
					height: 100%;
				}
			}
		}
	}

	.showImage {
		position: fixed;
		background-color: rgba(0, 0, 0, .5);
		width: 100vw;
		height: 100vh;
		top: 0;
		left: 0;
		z-index: 9999;
	}

	.showImage .centent_box {
		width: 350rpx;
		background-color: white;
		border-radius: 16rpx;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		padding: 30rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.showImage image {
		width: 350rpx;
		height: 350rpx;
	}

	.showImage .detail {
		margin-top: 20rpx;
	}
</style>
