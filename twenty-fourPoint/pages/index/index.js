var interval = null;
const target = 24;
const sign = [ '+', '-', '*', '/' ]
var duplicate = new Set()
var data = require("../config/database.js");
var config = require("../config/config.js");
var vis = ""
Page({
  /**
   * 页面的初始数据
   */
	data: {
    dataBase: data.EasyDataBase,
    voiceSucessFilePath:"/pages/audio/success.m4a",
    voiceFailureFilePath:"/pages/audio/failure.m4a",
    input_disabled:false,
    compute:"",
    time: 3,
    timeout:false,
    auto:false,
    code: null,
    formula:[],
    answer:[],
		reget: false,
		topTips: false,
		code_isFocus: true,//控制input 聚焦
		code: [],
		focus_status: [],
    length: 0,//已经输入的长度
    num_color:0,
    loose:"primary",
    press:"warn",
    duration: false,
    distance: 0,
    cur_diff:config.distanceToEasyEnd,
    cur_diff_map:"小学生",
    diff_container:false,
    diff_opt:[{
      id:0,
      diff:"小学生",
    },{
      id:1,
      diff:"初中生",
    },{
      id:2,
      diff:"大学生",
    }]
	},

  /**
   * 生命周期函数--监听页面加载
   */
	onLoad: function (options) {
		var that = this
    that.set_Focus()
    that.loadStrorage()
  },
  loadStrorage:function(){
    var diff = this.data.cur_diff
    var diff_map = wx.getStorageSync(config.diff_map)
    if(diff_map){
      this.setData({
        cur_diff_map: diff_map
      })
      this.switch_diff(diff_map)
    }else{
      wx.setStorageSync(config.diff_map, this.data.cur_diff_map)
    }
    var dis = wx.getStorageSync(diff)
    if(dis){
      console.log(dis)
      this.setData({
        distance: dis
      })
    }else{
      this.setData({
        distance: 2
      })
      wx.setStorageSync(diff, 2)
    }
  },
  choosediff_invisible:function(){
    this.setData({
      diff_container:false
    })
  },
  choosediff_visible:function(){
    this.setData({
      diff_container:true
    })
  },
  update_diff:function(e){
    var diff = e.currentTarget.dataset.diff
    this.switch_diff(diff)
    this.loadStrorage()
    this.choosediff_invisible()
  },
  switch_diff:function(diff){
    switch(diff){
      case "小学生":
        this.setData({
          cur_diff:config.distanceToEasyEnd,
          dataBase:data.EasyDataBase,
          cur_diff_map:"小学生"
        })
        break;
      case "初中生":
        this.setData({
          cur_diff:config.distanceToMediumEnd,
          dataBase:data.MediumDataBase,
          cur_diff_map:"初中生"
        })
        break;
      case "大学生":
        this.setData({
          cur_diff:config.distanceToDiffEnd,
          dataBase:data.DiffDataBase,
          cur_diff_map:"大学生"
        })
        break;
    }
    console.log("选择难度 = ", diff)
    wx.setStorageSync(config.diff_map, diff)
  },
  introduction:function(){
      wx.showModal({
        title: '玩法介绍',
        content: '给定四个数，通过+-*/运算符任意组合结果为24即为过关；例（9 5 9 5 的一个组合为5*5-9/9=24）',
        showCancel:false,
      })
  },
  success_audio:function(){
    this.innerAudioContext = wx.createInnerAudioContext();
    var voicePath = this.data.voiceSucessFilePath;
    this.innerAudioContext.src = voicePath;  
    this.innerAudioContext.play();
  },
  failure_audio:function(){
    this.innerAudioContext = wx.createInnerAudioContext();
    var voicePath = this.data.voiceFailureFilePath;
    this.innerAudioContext.src = voicePath;  
    this.innerAudioContext.play();
  },
  check_arth:function(compute){
    var numTag = 0
    var signTag = 0
    var leftTag = 0
    var rightTag = 0
    var parenthesesCount = 0

    for(var i = 0; i < compute.length; i++){
      if(!rightTag && !numTag && compute[i] >= '0' && compute[i] <= '9'){
        numTag = 1
        signTag = 0
        leftTag = 0
        rightTag = 0
      }else if(!leftTag && !signTag && (compute[i] == '+' || compute[i] == '-' || compute[i] == '*' || compute[i] == '/')){
        numTag = 0
        signTag = 1
        leftTag = 0
        rightTag = 0
      }else if(!leftTag && compute[i] == '('){
        parenthesesCount++
        numTag = 0
        signTag = 0
        rightTag = 0
        leftTag = 1
      }else if(!rightTag && compute[i] == ')'){
        parenthesesCount--
        numTag = 0
        signTag = 0
        rightTag = 1
        leftTag = 0
      }else{
        return false
      }
    }

    return parenthesesCount == 0
  },
  compute_arth:function(compute, start, end){
    var nums = new Array()
    var sign = new Array()
    for(var i = end; i >= start; i--){
      if(compute[i] == ')'){
        var j = i
        while(compute[j] != '(') j--
        nums.push(this.compute_arth(compute, j + 1, i - 1))
        i = j
      }else if(compute[i] >= '0' && compute[i] <= '9'){
        nums.push(compute[i] - '0')
      }else if(compute[i] == '*' || compute[i] == '/'){
        if(compute[i-1] == ')'){
          var j = i - 1
          while(compute[j] != '(') j--
          var n = nums.pop()
          nums.push(this.arithmetic(this.compute_arth(compute, j + 1, i - 1), n, compute[i]))
          i = j
        }else{
          var n = nums.pop()
          nums.push(this.arithmetic(compute[i-1], n, compute[i]))
          i--
        }
      }else{
        sign.push(compute[i])
      }
    }
    for(var i = 0; i < nums.length; i++){
      console.log("nums[" + i + "] = ", nums[i])
    }
    for(var i = 0; i < sign.length; i++){
      console.log("sign[" + i + "] = ", sign[i])
    }
    while(sign.length != 0){
      var s = sign.pop()
      var a = nums.pop()
      var b = nums.pop()
      nums.push(this.arithmetic(a, b, s))
    }

    var res = nums.pop()
    console.log("res = ", res)
    return res
  },
  success_gif:function(){
    var that = this
    that.setData({
      duration : true
    })

    setTimeout(function () {
				that.setData({
          duration : false,
          distance : that.data.distance + 1
        })
        wx.setStorageSync(that.data.cur_diff, that.data.distance)
        that.StartAutoModel()
		}, 3000)     
  },
  press_submit:function(){
    //判断思考时间是否结束
    if(!this.data.timeout){
      wx.showModal({
        title: '亲，',
        content: '3秒思考时间后才能答题哦！',
        showCancel:false,
      })
      return
    }
    //判断数是否用完
    if(this.data.num_color != 15 && this.data.num_color != 31){
      wx.showModal({
        title: '亲，',
        content: '四个数还没用完呢',
        showCancel:false,
      })

      return
    }
    var compute = this.data.compute
    //判断是否是正规算式
    if(!this.check_arth(compute)){
      wx.showModal({
        title: '亲，',
        content: '公式写错了哦',
        showCancel:false,
      })
      return
    }
    //计算是否等于24
    var target = this.compute_arth(compute, 0, compute.length - 1)
    console.log("target = ", target)
    if(target == 24){
      this.success_audio()
      this.success_gif()
    }else{
      wx.showModal({
        title: '亲，',
        content: '你的答案为' + target,
        showCancel:false,
      })
      this.failure_audio()
    }
  },
  press_num:function(e){
    var n = e.currentTarget.dataset.id
    console.log(n)
    var codes = this.data.code
    var com = this.data.compute
    if(codes.length < 4 || vis.indexOf(n) >= 0){
      return 
    }
    
    vis += n
    console.log("vis = ", vis)
    this.setData({
      compute: com + codes[n],
      num_color: this.data.num_color | Math.pow(2, n)
    })
    console.log("compute = ", this.data.compute)
    console.log("num_color = ", this.data.num_color)
  },
  press_back:function(){
    var com = this.data.compute
    if(com.length <= 0){
      return
    }
    var digit = 4 // 2^4 = 16 异或后不影响前四位状态码只要大于16且是2的倍数就行
    if(com[com.length - 1] >= '0' && com[com.length - 1] <= '9'){
      digit = vis[vis.length - 1]
      vis = vis.substring(0, vis.length - 1)
    }

    console.log("vis = ", vis)
    this.setData({
      compute: com.substring(0, com.length - 1),
      num_color: this.data.num_color ^ Math.pow(2, digit)
    })

    console.log("compute = ", this.data.compute)
    console.log("num_color = ", this.data.num_color)
  },
  press_clear:function(){
    vis = ""
    this.setData({
      compute : "",
      num_color:0
    })
  },
  press_arth:function(e){
    var arth = e.currentTarget.dataset.arch
    console.log(arth)
    var codes = this.data.code
    var com = this.data.compute
    if(codes.length < 4){
      return 
    }
    this.setData({
      compute: com + arth
    })

    console.log(this.data.compute)
  },
  //倒计时函数
	getCode: function (options) {
    var that = this;
		var currentTime = that.data.time
		interval = setInterval(function () {
			currentTime--;
			that.setData({
				time: currentTime
			})
			if (currentTime <= 0) {
				clearInterval(interval)
				that.setData({
          time: 3,
          timeout:true,
					reget: false,//改变字体样式颜色
					disabled: false
				})
			}
		}, 1000)
	},
	//验证码输入时获取验证码
	get_code(e) {
		var that = this;
		that.setData({
			code: e.detail.value
		});
		if (that.data.code.length == 0) {
			that.setData({
				focus_status: "1000"
			});
		}
		if (that.data.code.length == 1) {
			that.setData({
				length: e.detail.value.length,
				focus_status: "0100"
			});
		}
		if (that.data.code.length == 2) {
			that.setData({
				length: e.detail.value.length,
				focus_status: "0010"
			});
		}
		if (that.data.code.length == 3) {
			that.setData({
				length: e.detail.value.length,
				focus_status: "0001"
			});
		}
		if (that.data.code.length == 4) {
			that.setData({
        length: e.detail.value.length,
        timeout:false,
        reget:false,
        formula:[],
        answer:[]
      })
      clearInterval(interval)
      console.log(that.data.code)
      that.twentyfour(that.data.code)
		}
	},

  twentyfour(code){
  var that = this
  var nums = [];
  var result = new Array()
	for (var i = 0; i < 4; i++) {
		nums[i] = code[i] - '0'
	}

	var len = 4;
	var vis = [0, 0, 0, 0];
	for (var a = 0; a < len; a++) {
		vis[a] = 1;
		for (var b = 0; b < len; b++) {
			if (vis[b] == 1) continue;
			vis[b] = 1;
			for (var c = 0; c < len; c++) {
				if (vis[c] == 1) continue;
				vis[c] = 1;
				for (var d = 0; d < len; d++) {
					if (vis[d] == 1) continue;
					vis[d] = 1;
					var res = this.matchSign(nums[a], nums[b], nums[c], nums[d]);
					if (res != "") {
            result.push(res)
					}
					vis[d] = 0;
				}
				vis[c] = 0;
			}
			vis[b] = 0;
		}
		vis[a] = 0;
  }

  if(result.length == 0){
    wx.showModal({
      title: '提示',
      content: '如此妖孽的题，我也不会',
      showCancel:false,
      success: function (res) {
        that.reGetCode()
      }
    })
  }else{
    this.getCode()
    this.setData({
      formula: result,
    })
  }

  duplicate.clear()
  },

  matchSign(a, b, c, d) {
    var len = sign.length;
    for (var i = 0; i < len; i++) {
      for (var j = 0; j < len; j++) {
        for (var l = 0; l < len; l++) {
          var res1 = this.orderCalc(a, b, c, d, i, j, l);
          if (res1 != "") {
            return res1;
          }
        }
      }
    }
  
    return "";
  },

  arithmetic(a, b, s) {
    switch (s) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
        return a / b;
      default:
        return 0;
      }
  },

  calc(n, s){
    var stk = new Array()
    stk.push(n[0]);
    for (var i = 1; i < n.length; i++) {
      if (sign[s[i - 1]] == '*' || sign[s[i - 1]] == '/') {
        var tem = stk.pop();
        stk.push(this.arithmetic(tem, n[i], sign[s[i - 1]]));
      }
      else {
        stk.push(this.arithmetic(0, n[i], sign[s[i - 1]]));
      }
    }
  
    var res = 0;
    while (stk.length != 0) {6
      res += stk.pop();
    }
  
    return res;
  },

  orderCalc(a,  b,  c,  d,  i,  j,  l){
    var strs = sign[i] + sign[j] + sign[l]
    var ascll = strs.charCodeAt(0) + strs.charCodeAt(1) + strs.charCodeAt(2)
    //  a b c d
    var res0 = this.calc([a, b, c, d ], [i, j, l]);
    if (res0 == target && !duplicate.has(ascll)) {
      duplicate.add(ascll)
      return "" + a + sign[i] + b + sign[j] + c + sign[l] + d;
    }
    // (a b) c d
    var ab = this.arithmetic(a, b, sign[i])
    var res1 = this.calc([ ab , c, d ], [j, l]);
    if (res1 == target && !duplicate.has(ascll)) {
      duplicate.add(ascll)
      return "(" + a + sign[i] + b + ")" + sign[j] + c + sign[l] + d;
    }
    //  a b (c d)
    var cd = this.arithmetic(c, d, sign[l])                                
    var res2 = this.calc([a, b, cd], [i, j]);
    if (res2 == target && !duplicate.has(ascll)) {
      duplicate.add(ascll)
      return a + sign[i] + b+ sign[j] + "(" + c + sign[l] + d + ")";
    }
    // (a b)(c d)
    var res3 = this.arithmetic(this.arithmetic(a, b, sign[i]), this.arithmetic(c, d, sign[l]), sign[j]);
    if (res3 == target && !duplicate.has(ascll)) {
      duplicate.add(ascll)
      return "(" + a + sign[i] + b + ")" + sign[j] + "(" + c + sign[l] + d + ")";
    }
    //  a (b c) d
    var bc = this.arithmetic(b, c, sign[j])
    var res4 = this.calc([a, bc, d ], [i, l]);
    if (res4 == target && !duplicate.has(ascll)) {
      duplicate.add(ascll)
      return a + sign[i] + "(" + b + sign[j] + c + ")" + sign[l] + d;
    }
    // (a b c) d
    var abc = this.calc([a, b, c], [i, j])
    var res5 = this.calc([abc, d], [ l ]);
    if (res5 == target && !duplicate.has(ascll)) {
      duplicate.add(ascll)
      return "(" + a + sign[i] + b + sign[j] + c + ")" + sign[l] + d;
    }
    //  a (b c d)
    var bcd = this.calc([b, c, d], [j, l])
    var res6 = this.calc([a, bcd],  [i]);
    if (res6 == target && !duplicate.has(ascll)) {
      duplicate.add(ascll)
      return "" + a + sign[i] + "(" + b + sign[j] + c + sign[l] + d + ")";
    }

    return "";
  },

	set_Focus() { //聚焦input
		var that = this
		that.setData({
			code_isFocus: true
		})
	},

	//重新输入
	reGetCode:function(){
		this.setData({
      timeout:false,
      code: [],
      reget:false,
      formula:[],
      length: 0,
      focus_status: "1000",
      answer:[]
    });
  },
  
  //显示答案
  GetAnswer:function(){
    this.setData({
      reget:true,
      answer:this.data.formula,
    });
  },

  AutoModel:function(){
    var that = this
    if(that.data.time != 3){
      return 
    }
    wx.showModal({
      title: '提示',
      content: '要开始挑战了吗',
      success: function (res) {
        if (res.confirm) {
          that.setData({
            auto:true,
            input_disabled:true
          })
          that.StartAutoModel()
        } 
      }
    })
  },
  unAutoModel:function(){
    var that = this
    if(that.data.time != 3){
      return 
    }
    wx.showModal({
      title: '提示',
      content: '确定要退出嘛',
      success: function (res) {
        if (res.confirm) {
          that.setData({
            auto:false,
            input_disabled:false,
          })
          that.reGetCode()
        } 
      }
    })
  },
  StartAutoModel:function(){
    var that = this
    this.reGetCode()
    this.press_clear()
    if(that.data.distance == that.data.dataBase.length){
      wx.showModal({
        title: '提示',
        content: '恭喜你，你已经通关啦, 后续题目敬请期待',
        showCancel:false,
        success: function (res) {
          that.setData({
            auto:false,
          })
        }
      })
      return 
    }

    var idx = that.data.distance
    console.log("题号 = ", idx)
    var event = {
      detail:{
        value: that.data.dataBase[idx]
      }
    }
    this.get_code(event)
  },

  onShareAppMessage: function(){

  },

  onShareTimeline:function(){
    
  }
})