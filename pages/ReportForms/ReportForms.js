// pages/ReportForms/ReportForms.js

const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    startDate:'',
    endDate:'',
    todaySearch:true,
    tomorrowSearch:false,
    weekSearch:false,
    monthSearch:false,
    domain:'',
    rd_session:'',
    userinfo:'',
    report:'',
    total:'',
    height:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.showLoading({
      'title': '加载中',
      'mask': true,
      success: function () {
      }
    });
    app.getUserInfo(options);
    var times = setInterval(function () {
      var userinfo = wx.getStorageSync('userinfo');
      var timestamp = Date.parse(new Date()) / 1000;
      if (userinfo.rd_session && timestamp < userinfo.expires_in) {
        clearTimeout(times);
        var fansinfo = wx.getStorageSync('fansinfo');
        that.setData({
          domain: app.globalData.domain,
          rd_session: userinfo.rd_session,
          userinfo: userinfo.userinfo,
        });
        setTimeout(function () {
          wx.hideLoading();
        }, 1000);
        that.setDate();
        wx.getSystemInfo({
          success: function (res) {
            console.log(res);
            var screenWidth = res.windowWidth;
            var screenHeight = res.screenHeight;
            that.setData({
              height:screenHeight - 410
            })
            var left = (screenWidth * 78 / 750) / 2;
            var top = (screenWidth * 78 / 750) / 2;
            var elWidth = screenWidth * 79 / 750;
            var elHeight = screenWidth * 79 / 750;
            console.log(left, top);
          }
        })

      }
    }, 100);

  
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  },

  
  bindStartDateChange: function (e) {  
    this.setData({
      startDate: e.detail.value
    })
  }, 
  bindEndDateChange: function (e) {
    this.setData({
      endDate: e.detail.value
    })
  },
  searchType:function(e){
    console.log(e.currentTarget.dataset.id);
    this.setDate(e.currentTarget.dataset.id);
    this.setData({
      todaySearch: (e.currentTarget.dataset.id =='todaySearch'),
      tomorrowSearch: (e.currentTarget.dataset.id == 'tomorrowSearch'),
      weekSearch: (e.currentTarget.dataset.id == 'weekSearch'),
      monthSearch: (e.currentTarget.dataset.id == 'monthSearch')
    })
  },
  search:function(){
    this.setData({
      todaySearch: false,
      tomorrowSearch: false,
      weekSearch: false,
      monthSearch: false
    })
    this.getRrport();
  },
  setDate:function(str){
      switch(str){
        case 'todaySearch':
          this.today();
          break;
        case 'tomorrowSearch':
          this.tomorrow();
          break;
        case 'weekSearch':
          this.week();
          break;
        case 'monthSearch':
          this.month();
          break;
          default:
          this.today();
      }
      this.getReport();
   
  },
  getReport:function(){
    var that = this;
    var startDate = this.data.startDate;
    var endDate = this.data.endDate;
  
    wx.request({
      url: that.data.domain + '/api/report',
      data:{
        rd_session:that.data.rd_session,
        start:startDate,
        end:endDate,
      },
      success:function(res){
        if(res.data.errcode == 0){
          that.setData({
            report:res.data.data.report,
            total:res.data.data.total,
          })
        }else{
          wx.showModal({
            title: '提示',
            content: res.data.errmsg,
          })
        }
      },
      fail:function(res){

      }
    })
  },
  today:function(){
    var date = new Date();
    var year = date.getFullYear() 
    var  month = (1 + date.getMonth()) ;
    var  day = date.getDate();
    if (parseInt(month) < 10){
      month = '0' + month;
    }
    if (parseInt(day) < 10) {
      day = '0' + day;
    }
   var today = year + '-' + month + '-' + day;

   this.setData({
     startDate: today,
     endDate: today
   });
  
  },
  tomorrow: function () {
    var date = this.GetDate(1, 0);       //当前时间后一天
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    month = month < 10 ? "0" + month : month;
    day = day < 10 ? "0" + day : day;
    var tomorrow = year + '-' + month + '-' + day;
    this.setData({
      startDate: tomorrow,
      endDate: tomorrow
    });
  
  },
  week: function () {
    var startDate = "";
    var endDate = "";
    var date = new Date();      //当前时间
    var week = date.getDay();   //获取今天星期几
    var monday = this.GetDate2(week - 1, 1, date);      //获取星期一
    var sunday = this.GetDate2(7 - week, 2, date);   //获取星期天
    //起始时间的年月日
    var year1 = monday.getFullYear();
    var month1 = monday.getMonth() + 1;
    var day1 = monday.getDate();
    //结束时间的年月日
    var year2 = sunday.getFullYear();
    var month2 = sunday.getMonth() + 1;
    var day2 = sunday.getDate();
    //处理起始时间小于10的追加"0"在前面
    month1 = month1 < 10 ? "0" + month1 : month1;
    day1 = day1 < 10 ? "0" + day1 : day1;
    //处理结束时间小于10的追加"0"在前面
    month2 = month2 < 10 ? "0" + month2 : month2;
    day2 = day2 < 10 ? "0" + day2 : day2;
    startDate = year1 + "-" + month1 + "-" + day1 ;       //起始时间
    endDate = year2 + "-" + month2 + "-" + day2 ;      //结束时间
    this.setData({
      startDate: startDate,
      endDate: endDate
    });
    
  },
  month: function () {
    var startDate = "";
    var endDate = "";
    var date = new Date();      //当前时间
    var year = date.getFullYear();
    var month = date.getMonth();
    var min = new Date(year, month, 1);                 //本月月初
    var max = new Date(year, month + 1, 0);             //本月月底
    //起始时间的年月日
    var year1 = min.getFullYear();
    var month1 = min.getMonth() + 1;
    var day1 = min.getDate();
    //结束时间的年月日
    var year2 = max.getFullYear();
    var month2 = max.getMonth() + 1;
    var day2 = max.getDate();
    //处理起始时间小于10的追加"0"在前面
    month1 = month1 < 10 ? "0" + month1 : month1;
    day1 = day1 < 10 ? "0" + day1 : day1;
    //处理结束时间小于10的追加"0"在前面
    month2 = month2 < 10 ? "0" + month2 : month2;
    day2 = day2 < 10 ? "0" + day2 : day2;
    startDate = year1 + "-" + month1 + "-" + day1;       //起始时间
    endDate = year2 + "-" + month2 + "-" + day2;      //结束时间
    this.setData({
      startDate: startDate,
      endDate: endDate
    });
 
  },
  /*
  *获取当前日期前N天或后N日期(N = day)
  *type:1：前；2：后
  */
  GetDate: function (day, type) {
    var zdate = new Date();
    var edate;
    if(type === 1) {
      edate = new Date(zdate.getTime() - (day * 24 * 60 * 60 * 1000));
    } else {
      edate = new Date(zdate.getTime() + (day * 24 * 60 * 60 * 1000));
    }
    return edate;
  },

/*
*获取传入的日期前N天或后N日期(N = day)
*type:1：前；2：后
*date：传入的日期
*/
GetDate2:function (day, type, date) {
    var zdate;
    if (date === null || date === undefined) {
      zdate = new Date();
    } else {
      zdate = date;
    }
    var edate;
    if (type === 1) {
      edate = new Date(zdate.getTime() - (day * 24 * 60 * 60 * 1000));
    } else {
      edate = new Date(zdate.getTime() + (day * 24 * 60 * 60 * 1000));
    }
    return edate;
  }
})