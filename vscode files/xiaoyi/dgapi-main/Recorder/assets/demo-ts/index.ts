//====================引入Recorder=====================
// 必须引入的核心，recorder-core会自动往window下挂载名称为Recorder对象，全局可调用window.Recorder
import Recorder from 'recorder-core';

//需要使用到的音频格式编码引擎的js文件统统加载进来
import 'recorder-core/src/engine/mp3';
import 'recorder-core/src/engine/mp3-engine';

//以上三个也可以合并使用压缩好的recorder.xxx.min.js
//import Recorder from 'recorder-core/recorder.mp3.min' //已包含recorder-core和mp3格式支持
//import Recorder from 'recorder-core/recorder.wav.min' //已包含recorder-core和wav格式支持

//可选的插件支持项
import 'recorder-core/src/extensions/waveview';
//====================End=====================

// copy 的 QuickStart.html 代码，统统any，这些代码和普通js代码没有区别，主要用途是验证上面的import能正常引入和打包就完成目的了，对于ts 这些代码并没有什么特殊的地方
var win=window as any;
var doc=document as any;
var reclog=function(...args:any):void{ win.reclog.apply(null, args); }



var rec : any,wave : any, recBlob: any;
/**调用open打开录音请求好录音权限**/
win.recOpen=function(){//一般在显示出录音按钮或相关的录音界面时进行此方法调用，后面用户点击开始录音时就能畅通无阻了
	rec=null;
	wave=null;
	recBlob=null;
	var newRec=Recorder({
		type:"mp3",sampleRate:16000,bitRate:16 //mp3格式，指定采样率hz、比特率kbps，其他参数使用默认配置；注意：是数字的参数必须提供数字，不要用字符串；需要使用的type类型，需提前把格式支持文件加载进来，比如使用wav格式需要提前加载wav.js编码引擎
		,onProcess:function(buffers:any,powerLevel:any,bufferDuration:any,bufferSampleRate:any,newBufferIdx:any,asyncEnd:any){
			//录音实时回调，大约1秒调用12次本回调
			doc.querySelector(".recpowerx").style.width=powerLevel+"%";
			doc.querySelector(".recpowert").innerText=formatMs(bufferDuration,1)+" / "+powerLevel;
			
			//可视化图形绘制
			wave.input(buffers[buffers.length-1],powerLevel,bufferSampleRate);
		}
	});

	createDelayDialog(); //我们可以选择性的弹一个对话框：为了防止移动端浏览器存在第三种情况：用户忽略，并且（或者国产系统UC系）浏览器没有任何回调，此处demo省略了弹窗的代码
	newRec.open(function(){//打开麦克风授权获得相关资源
		dialogCancel(); //如果开启了弹框，此处需要取消
		
		rec=newRec;
		
		//此处创建这些音频可视化图形绘制浏览器支持妥妥的
		wave=Recorder.WaveView({elem:".recwave"});
		
		reclog("已打开录音，可以点击录制开始录音了",2);
	},function(msg:any,isUserNotAllow:any){//用户拒绝未授权或不支持
		dialogCancel(); //如果开启了弹框，此处需要取消
		reclog((isUserNotAllow?"UserNotAllow，":"")+"打开录音失败："+msg,1);
	});
	
	win.waitDialogClick=function(){
		dialogCancel();
		reclog("打开失败：权限请求被忽略，<span style='color:#f00'>用户主动点击的弹窗</span>",1);
	};
};



/**关闭录音，释放资源**/
win.recClose=function(){
	if(rec){
		rec.close();
		reclog("已关闭");
	}else{
		reclog("未打开录音",1);
	};
};



/**开始录音**/
win.recStart=function(){//打开了录音后才能进行start、stop调用
	if(rec&&Recorder.IsOpen()){
		recBlob=null;
		rec.start();
		reclog("已开始录音...");
	}else{
		reclog("未打开录音",1);
	};
};

/**暂停录音**/
win.recPause=function(){
	if(rec&&Recorder.IsOpen()){
		rec.pause();
	}else{
		reclog("未打开录音",1);
	};
};
/**恢复录音**/
win.recResume=function(){
	if(rec&&Recorder.IsOpen()){
		rec.resume();
	}else{
		reclog("未打开录音",1);
	};
};

/**结束录音，得到音频文件**/
win.recStop=function(){
	if(!(rec&&Recorder.IsOpen())){
		reclog("未打开录音",1);
		return;
	};
	rec.stop(function(blob:any,duration:any){
		console.log(blob,(win.URL||webkitURL).createObjectURL(blob),"时长:"+duration+"ms");
		
		recBlob=blob;
		reclog("已录制mp3："+formatMs(duration)+"ms "+blob.size+"字节，可以点击播放、上传了",2);
	},function(msg:any){
		reclog("录音失败:"+msg,1);
	});
};









/**播放**/
win.recPlay=function(){
	if(!recBlob){
		reclog("请先录音，然后停止后再播放",1);
		return;
	};
	var cls=("a"+Math.random()).replace(".","");
	reclog('播放中: <span class="'+cls+'"></span>');
	var audio=doc.createElement("audio");
	audio.controls=true;
	doc.querySelector("."+cls).appendChild(audio);
	//简单利用URL生成播放地址，注意不用了时需要revokeObjectURL，否则霸占内存
	audio.src=(win.URL||webkitURL).createObjectURL(recBlob);
	audio.play();
	
	setTimeout(function(){
		(win.URL||webkitURL).revokeObjectURL(audio.src);
	},5000);
};

/**上传**/
win.recUpload=function(){
	var blob=recBlob;
	if(!blob){
		reclog("请先录音，然后停止后再上传",1);
		return;
	};
	
	//本例子假设使用原始XMLHttpRequest请求方式，实际使用中自行调整为自己的请求方式
	//录音结束时拿到了blob文件对象，可以用FileReader读取出内容，或者用FormData上传
	var api="https://xx.xx/test_request";
	var onreadystatechange=function(title:any){
		return function(){
			if(xhr.readyState==4){
				if(xhr.status==200){
					reclog(title+"上传成功",2);
				}else{
					reclog(title+"没有完成上传，演示上传地址无需关注上传结果，只要浏览器控制台内Network面板内看到的请求数据结构是预期的就ok了。", "#d8c1a0");
					
					console.error(title+"上传失败",xhr.status,xhr.responseText);
				};
			};
		};
	};
	reclog("开始上传到"+api+"，请求稍后...");

	/***方式一：将blob文件转成base64纯文本编码，使用普通application/x-www-form-urlencoded表单上传***/
	var reader=new win.FileReader();
	reader.onloadend=function(){
		var postData="";
		postData+="mime="+encodeURIComponent(blob.type);//告诉后端，这个录音是什么格式的，可能前后端都固定的mp3可以不用写
		postData+="&upfile_b64="+encodeURIComponent((/.+;\s*base64\s*,\s*(.+)$/i.exec(reader.result)||[])[1]) //录音文件内容，后端进行base64解码成二进制
		//...其他表单参数
		
		var xhr=new XMLHttpRequest();
		xhr.open("POST", api);
		xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
		xhr.onreadystatechange=onreadystatechange("上传方式一【Base64】");
		xhr.send(postData);
	};
	reader.readAsDataURL(blob);

	/***方式二：使用FormData用multipart/form-data表单上传文件***/
	var form=new FormData();
	form.append("upfile",blob,"recorder.mp3"); //和普通form表单并无二致，后端接收到upfile参数的文件，文件名为recorder.mp3
	//...其他表单参数
	
	var xhr=new XMLHttpRequest();
	xhr.open("POST", api);
	xhr.onreadystatechange=onreadystatechange("上传方式二【FormData】");
	xhr.send(form);
};










//recOpen我们可以选择性的弹一个对话框：为了防止移动端浏览器存在第三种情况：用户忽略，并且（或者国产系统UC系）浏览器没有任何回调
var showDialog=function(){
	if(!/mobile/i.test(navigator.userAgent)){
		return;//只在移动端开启没有权限请求的检测
	};
	dialogCancel();
	
	//显示弹框，应该使用自己的弹框方式
	var div=doc.createElement("div");
	doc.body.appendChild(div);
	div.innerHTML=(''
		+'<div class="waitDialog" style="z-index:99999;width:100%;height:100%;top:0;left:0;position:fixed;background:rgba(0,0,0,0.3);">'
			+'<div style="display:flex;height:100%;align-items:center;">'
				+'<div style="flex:1;"></div>'
				+'<div style="width:240px;background:#fff;padding:15px 20px;border-radius: 10px;">'
					+'<div style="padding-bottom:10px;">录音功能需要麦克风权限，请允许；如果未看到任何请求，请点击忽略~</div>'
					+'<div style="text-align:center;"><a onclick="waitDialogClick()" style="color:#0B1">忽略</a></div>'
				+'</div>'
				+'<div style="flex:1;"></div>'
			+'</div>'
		+'</div>');
};
var createDelayDialog=function(){
	dialogInt=setTimeout(function(){//定时8秒后打开弹窗，用于监测浏览器没有发起权限请求的情况，在open前放置定时器利于收到了回调能及时取消（不管open是同步还是异步回调的）
		showDialog();
	},8000);
};
var dialogInt:any;
var dialogCancel=function(){
	clearTimeout(dialogInt);
	
	//关闭弹框，应该使用自己的弹框方式
	var elems=doc.querySelectorAll(".waitDialog");
	for(var i=0;i<elems.length;i++){
		elems[i].parentNode.removeChild(elems[i]);
	};
};
//recOpen弹框End

var formatMs=function(ms:any,all?:any){
	var f=Math.floor(ms/60000),m=Math.floor(ms/1000)%60;
	var s=(all||f>0?(f<10?"0":"")+f+":":"")
		+(all||f>0||m>0?("0"+m).substr(-2)+"″":"")
		+("00"+ms%1000).substr(-3);
	return s;
};

