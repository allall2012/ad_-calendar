// pages/AddAD/AddAD.js
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    date: '2017-10-2',
    array: ['主图', '次图', '赠送'],
    index:0,
    scrollTop:0,
    showModal:false,
    modalDialogWidth:0,
    modalDialogHeight:0,
    rd_session:'',
    domain:'',
    userinfo:'',
    ad:{},
    ad_id:'',
    notice:'',//所有人可以被通知的人
    selectNotice:'',//已选择的通知人
    fansinfo:'',//自己的个人信息
    checkBox:[],//勾选的 通知人
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var mp_id = options.mp_id || '';
    var ad_id = options.ad_id || '';
    
    console.log(options);
    if(mp_id == ''){
      wx.redirectTo({
        url: '/pages/OfficialAccounts/OfficialAccounts',
      })
    }
    var mpinfo = wx.getStorageSync('mpinfo');
    wx.setNavigationBarTitle({
      title: mpinfo.name
    })
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
          mp_id: options.mp_id,
          fansinfo:fansinfo,
        });
        setTimeout(function () {
          wx.hideLoading();
        }, 1000);
        var date = options.date || '';
        console.log(date);
        if (date == ''){
          var date = new Date();
          date = date.getFullYear() + "-" + (1 + date.getMonth()) + "-" + date.getDate();
        }
        that.setData({
          date: date,
          addPanelState: 'block',
          selectListState: 'hidden',
          ad_id: ad_id,
        });
        
        that.getAd();
     
      }
    }, 100);
  },
  getNotice:function(){
    var that = this;
    wx.request({
      url: that.data.domain + '/api/notice/',
      data:{
        rd_session:that.data.rd_session
      },
      success:function(res){
        if(res.data.errcode == 0){
          if(that.data.ad_id == ''){
            that.setData({
              selectNotice:res.data.data
            });
          }
          var selectNotice = that.data.selectNotice;
       
          var notice = res.data.data;
          var temp = new Array();
          var checkBox = new Array()
          selectNotice.forEach(function(val){
            temp[val.id] = val;
            checkBox.push(val.id);
          });
          var temp2 = new Array();
          notice.forEach(function(val){
              if(temp[val.id] != undefined){
                val.checked = 'checked';
              }
              // temp2[val.id] = val;
              temp2.push(val);
          });
         
          that.setData({
            notice: temp2,
            checkBox:checkBox,
          });
        }
      }
    })
  },
  getAd(){//获取广告详细信息
    var that = this;
    var ad_id = that.data.ad_id;
    if(ad_id != ''){
      wx.request({
        url: that.data.domain + '/api/ad/' + that.data.ad_id,
        data: {
          rd_session: that.data.rd_session
        },
        success: function (res) {
          if (res.data.errcode == 0) {
            //匹配广告位置
            var index = 0;
            switch(res.data.data.ad_place){
              case 'master':
                index=0;
                break;
              case 'minor':
                index = 1;
                break;
              case 'present':
                index = 2;
                break;
                default:
                index = 0;
            }

            that.setData({
              ad: res.data.data,
              selectNotice: res.data.data.notice,
              index:index,
              date:res.data.data.publish_at,
            });

            that.getNotice();
          }
        }
      })
    }else{
      //初始化数据
      var ad = { 
        'fans': that.data.fansinfo,
        'is_book': 0, 
        'mp_id': that.data.mp_id,
        'ad_place':'master'
      }
      that.setData({
        ad: ad,
      });
      that.getNotice();
    }
  },
  submit:function(){
    var that = this;
    var ad_id = this.data.ad_id;
    if(ad_id != ''){
      if(this.data.ad.fans.id != this.data.userinfo.id && this.data.fansinfo.role != 'admin'){
        wx.showModal({
          title: '提示',
          content: '您无权限修改该广告',
        });
        return false;
      }
    }
    var ad = that.data.ad;
    ad.notice_user = that.data.checkBox;
    ad.publish_at = that.data.date;
    ad.fans_id = ad.fans.id;
    console.log(ad);
    var ad_name = ad.ad_name || '';
    var ad_price = ad.ad_price || '';
    if(ad_name == ''){
      wx.showModal({
        title: '提示',
        content: '请填写广告名称',
      });
      return false;
    }
    if (ad_price == '') {
      wx.showModal({
        title: '提示',
        content: '请填写广告价格',
      });
      return false;
    }
    wx.request({
      url: that.data.domain + '/api/ad',
      method: 'POST',
      data:{
        ad:ad,
        rd_session:that.data.rd_session,
      },
      success:function(res){
        if(res.data.errcode == 0){
          wx.showToast({
            title: '成功',
            icon: 'success',
            duration: 2000
          });
          setTimeout(function(){
            wx.navigateTo({
              url: '/pages/index/index?mp_id=' + that.data.mp_id,
            })
          },1000);

        }else{
          wx.showModal({
            title: '提示',
            content: res.data.errmsg,
          })
        }
      }
    })

    
  },
  adName:function(e){
    console.log(e.detail.value);
    var ad = this.data.ad;
    ad.ad_name = e.detail.value;
    this.setData({
      ad:ad,
    })
  },
  adPrice: function (e) {
    console.log(e.detail.value);
    var ad = this.data.ad;
    ad.ad_price = e.detail.value;
    this.setData({
      ad: ad,
    })
  },
  isBookChange: function (e) {
    var ad = this.data.ad;
    ad.is_book = e.detail.value;
    this.setData({
      ad: ad,
    })
  },

   bindDateChange: function (e) {
     var ad = this.data.ad;
     ad.publish_at = e.detail.value,
    this.setData({
      date: e.detail.value,
      ad:ad,
    })
  },
   bindPickerChange: function (e) {
     var ad = this.data.ad;
     var ad_place = 'present';
     var index = parseInt(e.detail.value);
     
     switch (index) {
       case 0:
         ad_place = 'master';
         break;
       case 1:
         ad_place = 'minor';
         break;
       case 2:
         ad_place = 'present';
         break;
     }
     
     ad.ad_place = ad_place;
     console.log(index,ad_place);
    this.setData({
      index: e.detail.value,
      ad:ad,
    })
   },
   checkboxChange:function(e) {
     console.log('checkbox发生change事件，携带value值为：', e.detail.value);
     this.setData({
       checkBox:e.detail.value,      
     });
    //  this.setData({
    //    showModal: false
    //  });
   },
   noticeBack:function(){
     //添加通知用户 返回按钮
    this.setData({
       showModal: false
     });
   },
   noticeSure:function(){
     //添加通知用户 确定按钮
      var checkBox = this.data.checkBox;
      var notice = this.data.notice;
      var selectNotice = new Array();
      var temp = new Array();
      var temp2 = new Array();
      notice.forEach(function(val){
        val.checked = '';
        temp[val.id] = val;
      });
      checkBox.forEach(function(val){
        if(temp[val] != undefined){
          temp[val].checked = 'checked';
          selectNotice.push(temp[val]);
        }
      });
      temp.forEach(function(val){
          temp2.push(val);
      });
    this.setData({
        selectNotice:selectNotice,
        notice:temp2,
        showModal: false
    });
   },
   toClose:function(e){     
     wx.navigateBack({
       delta: 1
     })     
   },
   /**
     * 弹窗
     */
   showDialogBtn: function () {
     var that=this;
     wx.getSystemInfo({
       success: function(res) {
         that.setData({
           showModal: true,
           modalDialogWidth:res.windowWidth-25,
           modalDialogHeight:res.windowHeight-80
         })
       },
     })
     
   },
   /**
    * 弹出框蒙层截断touchmove事件
    */
   preventTouchMove: function () {
   },
   /**
    * 隐藏模态对话框
    */
   hideModal: function () {
     this.setData({
       showModal: false
     });
   },  /**
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

   }
})