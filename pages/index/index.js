
var wxCharts = require('../../utils/wxcharts.js');
var pieChart = null;
'use strict';
const app=getApp();
let choose_year = null,
  choose_month = null;
const conf = {
  data: {
    userinfo:'',//登录标识
    fansinfo:'',//粉丝信息 姓名 角色 等
    mp_id:'',//公众号id
    ads:'',//广告 原始数据
    adsDate:'',//按照日期为下标的广告数据（）
    ad_day:'',//当日广告 
    ad:'',//当前广告
    ad_id:'',//当前广告id
    rd_session:'',
    domain:'',
    selectDay: '11',
    selectTop: -500,
    selectLeft: 0,
    hasEmptyGrid: false,
    showPicker: false,
    panelState: 'hidden',
    showState: 'block',
    panelTop: 0,
    panelLeft: 0,
    selectStyle: '',
    selectDate: '',
    calendarHeight: '630rpx',
    addLeft:100,
    countInfo: [
      {
        date: '2017-12-10',
        firstCount: 0,
        secondCount: 40,
        giveCount: 30
      },
      {
        date: '2017-12-25',
        firstCount: 60,
        secondCount: 60,
        giveCount: 30
      }
    ]
  },
  onLoad(options) {
    var mp_id = options.mp_id || '';
    if(mp_id == ''){
      wx.redirectTo({
        url: '/pages/OfficialAccounts/OfficialAccounts',
      })
    }
    var that = this;
    const date = new Date();
    const cur_year = date.getFullYear();
    const cur_month = date.getMonth() + 1;
    const cur_day = date.getDate();
    const curr_time = date.getFullYear() + "-" + cur_month + "-" + cur_day;
    const weeks_ch = ['日', '一', '二', '三', '四', '五', '六'];
    that.setData({
      cur_year,
      cur_month,
      weeks_ch,
      curr_time,
      selectDay:cur_day,
    });
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
        that.setData({
          domain: app.globalData.domain,
          rd_session: userinfo.rd_session,
          userinfo: userinfo.userinfo,
          mp_id:options.mp_id
        });
        var cur_year = that.data.cur_year;
        var cur_month = that.data.cur_month;
        that.calculateEmptyGrids(cur_year, cur_month);
        that.calculateDays(cur_year, cur_month);


        setTimeout(function () {
          wx.hideLoading();
        }, 1000);
        that.getFansInfo();
        that.getMp();
        that.getAd(cur_year,cur_month);
        wx.getSystemInfo({
          success: function (res) {
            that.setData({
              addLeft: (res.windowWidth - 84) / 2
            });
            console.log((res.windowWidth - 84) / 2);
          },
        })

      }
    }, 100);
  },
  getFansInfo(){
    var that = this;
    wx.request({
      url: that.data.domain + '/api/fans',
      data:{
        rd_session:that.data.rd_session
      },
      success:function(res){
        if(res.data.errcode == 0){
          that.setData({
            fansinfo:res.data.data.data
          });
          try {
            wx.setStorageSync('fansinfo', res.data.data.data)
          } catch (e) {
          }
        }
      }
    })
  },
  getMp(){
    var that = this;
    wx.request({
      url: that.data.domain + '/api/mp/'+that.data.mp_id,
      data: {
        rd_session: that.data.rd_session
      },
      success: function (res) {
        if (res.data.errcode == 0) {
          that.setData({
            mpinfo: res.data.data
          });
          wx.setNavigationBarTitle({
            title: res.data.data.name
          })
          try {
            wx.setStorageSync('mpinfo', res.data.data)
          } catch (e) {
          }
        }
      }
    })
  },
  getAd(year,month){
    var that = this;
    if(month < 10){
      month = '0'+month;
    }
    wx.request({
      url: that.data.domain + '/api/ad',
      data: {
        rd_session: that.data.rd_session,
        mp_id:that.data.mp_id,
        year:year,
        month:month,
      },
      success: function (res) {
        if (res.data.errcode == 0) {
         
          var ads = res.data.data;
          var countInfo = new Array();
          var temp = new Array();
          var adsDate = new Array();
          ads.forEach(function(val){
           
            if (adsDate[val.publish_at] == undefined) {
              adsDate[val.publish_at] = new Array();
            }
            switch (val.ad_place){
              case 'master':
                val.flag = 'red';
                break;
                case 'minor':
                val.flag = 'green';
                break;
                case 'present':
                val.flag = 'yellow';
                break;
            }
            adsDate[val.publish_at].push(val);
            if(temp[val.publish_at] == undefined){
              temp[val.publish_at] = {
                date:val.publish_at,
                firstCount: 0,
                secondCount: 0,
                giveCount: 0
              };
            }
            if (val.ad_place == 'master') {
              temp[val.publish_at].firstCount += 1;
            } else if (val.ad_place == 'minor') {
              temp[val.publish_at].secondCount += 1;
            } else if (val.ad_place == 'present') {
              temp[val.publish_at].giveCount += 1;
            }
          });
          for(var item in temp){
            countInfo.push(temp[item]);
          }
          // var ad_day = adsDate[that.data.curr_time] || [];
          that.setData({
            ads: res.data.data,
            adsDate:adsDate,
            countInfo:countInfo,
          });
          that.getAdDay(that.data.curr_time);
          that.setIcon();
        }
      }
    })
  },
  getAdDay(time){//设置当前选择日期的 广告
    var adsDate = this.data.adsDate;
    var ad_day = adsDate[time] || [];
    this.setData({
      ad_day:ad_day
    });
  },
  setIcon(){//设置日历上的图标
    var that = this;
    var countInfos = that.data.countInfo;
    for (var i in countInfos) {
      that.addCharts(countInfos[i].date, countInfos[i].firstCount, countInfos[i].secondCount, countInfos[i].giveCount, '#ffffff', '#35307b', false);
    }
  },
  getThisMonthDays(year, month) {
    console.log(new Date(year, month, 0).getDate());
    return new Date(year, month, 0).getDate();

  },
  getFirstDayOfWeek(year, month) {
    console.log('week:' + new Date(Date.UTC(year, month - 1, 1)).getDay());
    return new Date(Date.UTC(year, month - 1, 1)).getDay();
  },
  calculateEmptyGrids(year, month) {
    var that = this;
    const firstDayOfWeek = this.getFirstDayOfWeek(year, month);
    let empytGrids = [];
    if (firstDayOfWeek > 0) {
      for (let i = 0; i < firstDayOfWeek; i++) {
        empytGrids.push(i);
      }
      this.setData({
        hasEmptyGrid: true,
        empytGrids
      });
    } else {
      this.setData({
        hasEmptyGrid: false,
        empytGrids: []
      });
    }
   

  },
  calculateDays(year, month) {
    let days = [];
    const thisMonthDays = this.getThisMonthDays(year, month);
    const getFirstDayOfWeek = this.getFirstDayOfWeek(year, month);
    for (let i = 1; i <= thisMonthDays; i++) {
      days.push({
        day: i,
        choosed: false
      });
    }
    console.log('加载执行:' + thisMonthDays + ",week:" + getFirstDayOfWeek);
    if (getFirstDayOfWeek>=5){
      if (getFirstDayOfWeek>=6){
        if (thisMonthDays>=30){
          this.setData({
            calendarHeight: '740rpx'
          });
        }else{
          this.setData({
            calendarHeight: '630rpx'
          });
        }
      }else{
        if (thisMonthDays >= 31){
          this.setData({
            calendarHeight: '740rpx'
          });
        }else{
          this.setData({
            calendarHeight: '630rpx'
          });
        }
      }
    }else{
      this.setData({
        calendarHeight: '630rpx'
      });
    }
       this.setData({
      days
    });
  },
  handleCalendar(e) {
    this.setData({
      'showState': 'hidden'
    });
    const handle = e.currentTarget.dataset.handle;
    const cur_year = this.data.cur_year;
    const cur_month = this.data.cur_month;

    var cur_year_month;
    if (handle === 'prev') {
      let newMonth = cur_month - 1;
      let newYear = cur_year;
      if (newMonth < 1) {
        newYear = cur_year - 1;
        newMonth = 12;
      }

      this.calculateDays(newYear, newMonth);
      this.calculateEmptyGrids(newYear, newMonth);

      this.setData({
        cur_year: newYear,
        cur_month: newMonth
      });
      if (cur_month == 1) {
        cur_year_month = (cur_year - 1) + '-' + 12;
      } else {
        cur_year_month = cur_year + '-' + (cur_month - 1);
      }
    } else {
      let newMonth = cur_month + 1;
      let newYear = cur_year;
      if (newMonth > 12) {
        newYear = cur_year + 1;
        newMonth = 1;
      }

      this.calculateDays(newYear, newMonth);
      this.calculateEmptyGrids(newYear, newMonth);

      this.setData({
        cur_year: newYear,
        cur_month: newMonth
      });
      if (cur_month == 12) {
        cur_year_month = (cur_year + 1) + '-' + 1;
      } else {
        cur_year_month = cur_year + '-' + (1 + cur_month);
      }

    }
    var that = this;
    that.getAd(that.data.cur_year,that.data.cur_month);
    // console.log(cur_year + "-" + (1+cur_month));    
    var countInfos = that.data.countInfo;
    for (var i in countInfos) {
      if (countInfos[i].date.indexOf(cur_year_month) > -1) {
        that.addCharts(countInfos[i].date, countInfos[i].firstCount, countInfos[i].secondCount, countInfos[i].giveCount, '#ffffff', '#35307b',false);
      }
    }

  },
  tapDayItem(e) {
    console.log(e);
    const idx = e.currentTarget.dataset.idx;
    const days = this.data.days;
    days[idx].choosed = !days[idx].choosed;
    this.setData({
      days,
    });
  },
  chooseYearAndMonth() {
  },
  pickerChange(e) {
    const val = e.detail.value;
    choose_year = this.data.picker_year[val[0]];
    choose_month = this.data.picker_month[val[1]];
  },
  tapPickerBtn(e) {
    const type = e.currentTarget.dataset.type;
    const o = {
      showPicker: false,
    };
    if (type === 'confirm') {
      o.cur_year = choose_year;
      o.cur_month = choose_month;
      this.calculateEmptyGrids(choose_year, choose_month);
      this.calculateDays(choose_year, choose_month);
    }

    this.setData(o);
  },
  onShareAppMessage() {
    return {
      title: '广告日历',
      desc: '广告日历',
      path: 'pages/index/index'
    };
  },
  onPress(event) {
    // console.log(event, event.currentTarget.dataset['ad_id']);
    var ad_id = event.currentTarget.dataset['ad_id'];

    var ad_day = this.data.ad_day;
    var ad = '';
    ad_day.forEach(function(val){
      if(val.id == ad_id){
          ad = val;
      }
    });
    try {
      wx.setStorageSync('ad', ad);
      } catch (e) {
    }
    this.setData({
      panelState: 'block',
      panelTop: event.currentTarget.offsetTop - 2,
      ad_id:ad_id,
      ad:ad,
    });
  },
  addCharts(date, firstCount, secondCount, giveCount, backgroundColor, foreColor,isTapChart) {
    var days = date.split('-');
    var day = days[days.length - 1];
    var windowWidth = 80;
    try {
      var res = wx.getSystemInfoSync();
      windowWidth = res.windowWidth;
    } catch (e) {
      console.error('getSystemInfoSync failed!');
    }
   
    var screenWidth = 0;
    wx.getSystemInfo({
      success: function (res) {
        var screenWidth = res.windowWidth;
        var left = (screenWidth * 78 / 750) / 2;
        var top = (screenWidth * 78 / 750) / 2;
        var elWidth = screenWidth * 79 / 750;
        var elHeight = screenWidth * 79 / 750;
        if (isTapChart){
          elWidth = screenWidth * 78/ 750;
          elHeight = screenWidth * 78 / 750;
          left = (screenWidth * 78 / 750) / 2;
          top = (screenWidth * 78 / 750) / 2;
          console.log("width is :" + elWidth)

        }
       
        pieChart = new wxCharts({
          canvasId: 'canvas_' + date,
          type: 'ring',
          series: [           
            {
            name: '头图',
            data: firstCount,
          }, {
            name: '次图',
            data: secondCount,
          }, {
            name: '赠送',
            data: giveCount,
          }],
          width: elWidth ,
          height: elHeight,
          legend: false,
          dataLabel: false,
          title: day,
          backgroundColor: backgroundColor,
          foreColor: foreColor,
          fontSize: screenWidth * 16 / 375,
          textTop: top,
          textLeft: left,
          animation: false
        });
      }
    })

  }
  ,
  close() {
    this.setData({
      panelState: 'hidden'
    });
  },
  selectDay(e) {
    console.log(e.currentTarget.dataset.id);
    this.setData({
      selectDate: e.currentTarget.dataset.id
    });
  },
  toUpdate(e) {
    var ad_id = this.data.ad.id;
    var mp_id = this.data.mp_id;
    wx.navigateTo({
      url: '/pages/AddAD/AddAD?ad_id=' + ad_id+'&mp_id='+mp_id,
    })
  },
  // 点击日历上某一天
  tapDayItem(e) {
    var that = this;
   
    var selectDayValue = e.currentTarget.dataset.selectday;
    var selectTime = this.data.cur_year + '-' + this.data.cur_month + '-' + selectDayValue;
    var countInfos = this.data.countInfo;
  
    this.setData({
      panelState:'hidden',
    })
    for (var i in countInfos) {
      if (countInfos[i].date == selectTime) {
        that.setData({
          showState: 'hidden'
        });
        break;
      } else {
        
      }
    }

    //
    var objectId = selectTime;
    var countInfos = this.data.countInfo;

    if(countInfos.length > 0){
      for (var i in countInfos) {
        if (countInfos[i].date == objectId) {
          this.addCharts(countInfos[i].date, countInfos[i].firstCount, countInfos[i].secondCount, countInfos[i].giveCount, '#6b62f1', '#ffffff', false);

        }
        else {
          that.setData({
            showState: 'block',
            selectDay: selectDayValue,
            selectLeft: e.currentTarget.offsetLeft,
            selectTop: e.currentTarget.offsetTop
          });
          this.addCharts(countInfos[i].date, countInfos[i].firstCount, countInfos[i].secondCount, countInfos[i].giveCount, '#ffffff', '#35307b', false);
        }
      }
    }else{

      that.setData({
        showState: 'block',
        selectDay: selectDayValue,
        selectLeft: e.currentTarget.offsetLeft,
        selectTop: e.currentTarget.offsetTop
      });
      // console.log(selectDayValue);
      this.addCharts('2018-01-11', 0, 0, 0, '#ffffff', '#35307b', false);
    }

    // console.log(e.currentTarget.offsetLeft, e.currentTarget.offsetTop);
   //设置当日广告数据
    that.getAdDay(selectTime);
   
  },
  //点击图表
  canvastap(e) {
    var objectId = e.currentTarget.dataset.id.replace('canvas_', '');
    var countInfos = this.data.countInfo;
    for (var i in countInfos) {
      if (countInfos[i].date == objectId) {
        this.addCharts(countInfos[i].date, countInfos[i].firstCount, countInfos[i].secondCount, countInfos[i].giveCount, '#6b62f1', '#ffffff',true);
      }
      else {
        this.addCharts(countInfos[i].date, countInfos[i].firstCount, countInfos[i].secondCount, countInfos[i].giveCount, '#ffffff', '#35307b',false);
      }
    }
  },
  onPullDownRefresh: function () {
    console.log("下拉啦");
    wx.stopPullDownRefresh();
  },
  toDelete(e) {
    let that = this;
    wx.showModal({
      title: '提示',
      content: '确定要删除'+that.data.ad.ad_name + '?',
      success: function (res) {
        if (res.confirm) {
          that.setData({
            panelState: 'hidden'
          });
          that.deleteAd();



        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
  deleteAd:function(){
    var that = this;
    var ad = this.data.ad;
    wx.request({
      url: that.data.domain + '/api/ad/' + ad.id,
      method:'DELETE',
      data:{
        rd_session:that.data.rd_session
      },
      success:function(res){
        if(res.data.errcode == 0){
          var cur_year = that.data.cur_year;
          var cur_month = that.data.cur_month;
          that.getAd(cur_year, cur_month);
          that.setData({
            showState:'hidden'
          });
        }else{
          wx.showModal({
            title: '提示',
            content: res.data.errmsg,
          })
        }
      }
    })
  }
};

Page(conf);