var interval = null;
const target = 24;
const sign = [ '+', '-', '*', '/' ]
var duplicate = new Set()
Page({
  /**
   * 页面的初始数据
   */
	data: {
    code: null,
    formula:["公式显示在这里"],
		reget: false,
		topTips: false,
		code_isFocus: true,//控制input 聚焦
		code: [],
		focus_status: [],
		length: 0,//已经输入的长度
	},

  /**
   * 生命周期函数--监听页面加载
   */
	onLoad: function (options) {
		var that = this;
		that.set_Focus();
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
      })
      
      console.log(that.data.code)
      that.twentyfour(that.data.code)
		}
	},

  twentyfour(code){
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

  if(result.length != 0){
    this.setData({
      formula: result,
      reget:true,
    })
  }else{
    this.setData({
      formula:"无解",
      reget:true,
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

	//重新获取验证码
	reGetCode:function(){
		this.setData({
      code: [],
      reget:false,
      formula:["公式显示在这里"],
      length: 0,
      focus_status: "1000"
    });
	}

})