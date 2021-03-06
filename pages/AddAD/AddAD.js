// pages/AddAD/AddAD.js
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    date: '2017-10-2',
    array: ['头图', '次图', '赠送'],
    place_index: 0,
    scrollTop: 0,
    showModal: false,
    modalDialogWidth: 0,
    modalDialogHeight: 0,
    rd_session: '',
    domain: '',
    userinfo: '',
    ad: {},
    ad_id: '',
    mp_id: '',
    mpinfo: '',
    mpplaces: '',
    notice: '',//所有可以被通知的人
    selectNotice: '',//已选择的通知人
    needNotice: [],// 必须通知的人
    fansinfo: '',//自己的个人信息
    checkBox: [],//勾选的 通知人
    is_submit: false,
    scene: '',
    companyinfo: '',
    labels: '',
    status: false,
    status_del: true,
    input_val: '',
    adnames: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var mp_id = options.mp_id || '';
    var ad_id = options.ad_id || '';

    console.log(options);
    if (mp_id == '') {
      wx.redirectTo({
        url: '/pages/OfficialAccounts/OfficialAccounts',
      })
    }
    var mpinfo = wx.getStorageSync('mpinfo');
    wx.setNavigationBarTitle({
      title: mpinfo.name,
    })
    this.setData({
      mpinfo: mpinfo,
      mpplaces: mpinfo.mpplaces
    });
    wx.showLoading({
      'title': '加载中',
      'mask': true,
      success: function () {
      }
    });

    app.getUserInfo(options);
    app.checkAuth();
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
          fansinfo: fansinfo,
        });
        setTimeout(function () {
          wx.hideLoading();
        }, 1000);
        var date = options.date || '';
        if (date == '') {
          date = new Date();
        }
        // var date = new Date();
        date = that.formatDate(date);
        that.setData({
          date: date,
          addPanelState: 'block',
          selectListState: 'hidden',
          ad_id: ad_id,
        });
        that.getCompanyInfo();
        that.getAd();
      }
    }, 100);
  },
  getCompanyInfo: function () {
    var that = this;
    var mpinfo = this.data.mpinfo;
    var company_id = mpinfo.company_id;
    wx.request({
      url: that.data.domain + '/api/company/' + company_id,
      data: {
        rd_session: that.data.rd_session,
        mp_id: that.data.mp_id,
      },
      success: function (res) {
        if (res.data.errcode == 0) {
          var labels = res.data.data.labels || [];
          labels.forEach(function (val) {
            // var option_length = 
            if (val.label_type == 'select' && val.label_option.length <=2) {
              val.value = val.label_option[0];
            }else{
              val.value = '';
            }
            val.label_index = 0;
          });
          that.setData({
            companyinfo: res.data.data,
            labels: labels
          });
          // that.getAd();
        } else {
          wx.showModal({
            title: '提示',
            content: res.data.errmsg,
          })
        }
      }
    })
  },
  setPlaces: function () {

  },
  formatDate: function (date) {
    var type = typeof (date);
    console.log(type);
    if (type == 'object') {
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      var day = date.getDate();
    } else {
      var arr = date.split('-');
      var year = arr[0];
      var month = arr[1];
      var day = arr[2];
    }
    month = month < 10 ? "0" + month : month;
    day = day < 10 ? "0" + day : day;
    return year + '-' + month + '-' + day;
  },
  getNotice: function () {
    var that = this;
    wx.request({
      url: that.data.domain + '/api/notice/',
      data: {
        rd_session: that.data.rd_session,
        mp_id: that.data.mp_id,
      },
      success: function (res) {
        if (res.data.errcode == 0) {
          if (that.data.ad_id == '') {
            that.setData({
              selectNotice: res.data.data.selectNotice
            });
          }
          that.setData({
            needNotice: res.data.data.selectNotice
          });
          var selectNotice = that.data.selectNotice;
          var notice = res.data.data.optional;
          var temp1 = new Array();
          var temp2 = new Array();
          var temp3 = new Array();
          selectNotice.forEach(function (val) {
            temp1['flat' + val.id] = val;
            temp1.length++;
          });
          notice.forEach(function (val) {
            temp2['flat' + val.id] = val;
            temp2.length++;
          });

          for (var key in temp2) {
            var val = temp2[key];
            val.checked = '';
            if (temp1[key] != undefined) {
              val.checked = 'checked';
            }
            temp3.push(val);
          }
          // console.log(temp3);
          that.setData({
            notice: temp3,
          });
        } else {
          wx.showModal({
            title: '提示',
            content: res.data.errmsg,
          })
        }
      }
    })
  },
  getAd() {//获取广告详细信息
    var that = this;
    var ad_id = that.data.ad_id;
    if (ad_id != '') {
      wx.request({
        url: that.data.domain + '/api/ad/' + that.data.ad_id,
        data: {
          rd_session: that.data.rd_session
        },
        success: function (res) {
          if (res.data.errcode == 0) {
            //匹配广告位置
            var place_index = -1;
            var times = setInterval(function(){
              var labels = that.data.labels;
              if (typeof (labels) == 'object'){
                var mpplaces = that.data.mpplaces;
                clearInterval(times);
                mpplaces.forEach(function (val, key) {
                  if (val.id == res.data.data.ad_place_id || val.place_name == res.data.data.ad_place_name) {
                    place_index = key;
                  }
                });
                if (place_index < 0) { //原位置信息已删除了
                  place_index = mpplaces.length;
                  mpplaces = mpplaces.concat({ place_name: res.data.data.ad_place_name });
                  that.setData({ mpplaces: mpplaces });
                }
                var extend = res.data.data.extend || [];
                labels.forEach(function (val) {
                  val.value = '';
                  extend.every(function (val2) {
                    if (val.id == val2.id || val.label_name == val2.label_name) {
                      val.value = val2.value;
                      val.label_index = val2.label_index || 0;
                      return false;//跳出内循环体
                    }
                    return true;
                  });
                });
                that.setData({ labels: labels });
                that.setData({
                  ad: res.data.data,
                  selectNotice: res.data.data.notice,
                  place_index: place_index,
                  date: res.data.data.publish_at,
                });
                that.getNotice();
              }
            },10);
           


          } else {
            wx.showModal({
              title: '提示',
              content: res.data.errmsg,
            })
          }
        }
      })
    } else {
      //初始化数据
      var mpplaces = that.data.mpplaces;
      var ad = {
        'fans': that.data.fansinfo,
        'is_book': 0,
        'is_bill': 1,
        'ad_place':'master',
        'mp_id': that.data.mp_id,
        'ad_place_id': mpplaces[0].id,
        'ad_place_name': mpplaces[0].place_name,
        'remark': ''
      }
      that.setData({
        ad: ad,
      });
      that.getNotice();
    }
  },
  submit: function () {

    var is_submit = this.data.is_submit;
    if (is_submit) {
      //判断是否重复提交
      wx.showModal({
        title: '提示',
        content: '不要重复提交',
      });
      return false;
    }

    var that = this;
    var ad_id = this.data.ad_id;
    if (ad_id != '') {
      if (this.data.ad.fans.id != this.data.userinfo.id && this.data.fansinfo.role != 'admin') {
        wx.showModal({
          title: '提示',
          content: '您无权限修改该广告',
        });
        return false;
      }
    }
    var ad = that.data.ad;
    var notice_user = new Array();
    var selectNotice = that.data.selectNotice;
    selectNotice.forEach(function (val) {
      notice_user.push(val.id);
    });
    ad.notice_user = notice_user;
    // console.log(ad);
    // return ;
    ad.publish_at = that.data.date;
    ad.fans_id = ad.fans.id;

    var ad_name = ad.ad_name || '';
    var ad_price = ad.ad_price || '';
    if (ad_name == '') {
      wx.showModal({
        title: '提示',
        content: '请填写广告名称',
      });
      return false;
    }
    //防止重复提交
    that.setData({
      is_submit: true
    });
    wx.showLoading({
      title: '提交中',
    });
    var label = this.data.labels;
    ad.extend = label;
    // console.log(ad);
    // return;
    wx.request({
      url: that.data.domain + '/api/ad',
      method: 'POST',
      data: {
        ad: ad,
        rd_session: that.data.rd_session,
      },
      success: function (res) {
        if (res.data.errcode == 0) {
          wx.showToast({
            title: '成功',
            icon: 'success',
            duration: 2000
          });
          setTimeout(function () {
            var mp_id = that.data.mp_id;
            var date = that.data.date;
            var scene = '?mp_id=' + mp_id + "&date=" + date;
            that.setData({ scene: scene });
            wx.redirectTo({
              url: '/pages/index/index' + that.data.scene,
            })
          }, 1000);

        } else {
          //防止重复提交
          that.setData({
            is_submit: false
          });
          wx.hideLoading();
          wx.showModal({
            title: '提示',
            content: res.data.errmsg,
          })
        }
      }
    })


  },
  // adName: function (e) {
  //   console.log(e.detail.value);
  //   var ad = this.data.ad;
  //   ad.ad_name = e.detail.value;
  //   this.setData({
  //     ad: ad,
  //   })
  // },
  remark: function (e) {
    console.log(e.detail.value);
    var ad = this.data.ad;
    ad.remark = e.detail.value;
    this.setData({
      ad: ad,
    })
  },
  labels: function (e) {

    //第几个标签
    var index = e.currentTarget.dataset.index;
    
    var value = e.detail.value;

    var labels = this.data.labels;
    if (labels[index].label_type == 'select' && labels[index].label_option.length > 2){
      labels[index].value = labels[index].label_option[value];
      labels[index].label_index = value;
    }else{
      labels[index].value = value;
     
    }

    this.setData({
      labels: labels
    });

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
  isBillChange: function (e) {
    var ad = this.data.ad;
    ad.is_bill = e.detail.value;
    console.log(e.detail.value);
    this.setData({
      ad: ad,
    })
  },

  bindDateChange: function (e) {
    var ad = this.data.ad;
    ad.publish_at = e.detail.value,
      this.setData({
        date: e.detail.value,
        ad: ad,
      })
  },
  bindPickerChange: function (e) {
    var ad = this.data.ad;
    var mpplaces = this.data.mpplaces;
    var place_index = parseInt(e.detail.value);

    ad.ad_place_id = mpplaces[place_index].id || 0;
    ad.ad_place_name = mpplaces[place_index].place_name || '';
    //  if (ad_place == 'present'){
    //    ad.ad_price = 0; 
    //  }
    //  ad.ad_place = ad_place;
    //  console.log(index,ad);
    this.setData({
      place_index: e.detail.value,
      ad: ad,
    })
  },
  checkboxChange: function (e) {
    console.log('checkbox发生change事件，携带value值为：', e.detail.value);
    this.setData({
      checkBox: e.detail.value,
    });
    //  this.setData({
    //    showModal: false
    //  });
  },
  noticeBack: function () {
    //添加通知用户 返回按钮
    this.setData({
      showModal: false
    });
  },
  noticeSure: function () {
    //添加通知用户 确定按钮
    var checkBox = this.data.checkBox;
    var notice = this.data.notice;
    var selectNotice = new Array();
    var temp = new Array();
    var temp2 = new Array();
    notice.forEach(function (val) {
      val.checked = '';
      temp[val.id] = val;
    });
    checkBox.forEach(function (val) {
      if (temp[val] != undefined) {
        temp[val].checked = 'checked';
        selectNotice.push(temp[val]);
      }
    });
    temp.forEach(function (val) {
      temp2.push(val);
    });
    var needNotice = this.data.needNotice;
    // console.log(needNotice);
    selectNotice = this.data.needNotice.concat(selectNotice);
    this.setData({
      selectNotice: selectNotice,
      notice: temp2,
      showModal: false
    });
  },
  toClose: function (e) {
    wx.navigateBack({
      delta: 1
    })
  },
  //后台查询 推荐广告名称
  query:function(keywords){
    var that = this;
    var mpinfo = this.data.mpinfo;
    var company_id = mpinfo.company_id;
    wx.request({
      url: that.data.domain + '/api/query',
      data: {
        rd_session: that.data.rd_session,
        mp_id: that.data.mp_id,
        company_id: company_id,
        keywords:keywords
      },
      success: function (res) {
        if (res.data.errcode == 0) {
          that.setData({
            adnames:res.data.data
          });
        } else {
          wx.showModal({
            title: '提示',
            content: res.data.errmsg,
          })
        }
      }
    })
  },
  shield:function(e){
    var that = this;
    var mpinfo = this.data.mpinfo;
    var company_id = mpinfo.company_id;
    var custom_id = e.currentTarget.dataset.id;
    // console.log(custom_id);
    // wx.showModal({
    //   title: '提示',
    //   content: "111",
    // })
    wx.request({
      url: that.data.domain + '/api/query/' + custom_id,
      data: {
        rd_session: that.data.rd_session,
        mp_id: that.data.mp_id,
        company_id: company_id,
      },
      success: function (res) {
        if (res.data.errcode == 0) {

        } else {
          wx.showModal({
            title: '提示',
            content: res.data.errmsg,
          })
        }
      }
    })
    var adnames = that.data.adnames;
    adnames.forEach(function (val, key) {
      if (val.id == custom_id) {
        adnames.splice(key, 1)
      }
    });
    that.setData({ adnames: adnames });
  },
  //输入框聚焦显示弹窗
  show2: function () {
    var ad = this.data.ad;
    var ad_name = ad.ad_name || '';
    this.query(ad_name);
    this.setData({
      status: true
    })
  },
  //根据输入内容搜索广告主
  adName: function (e) {
    console.log(e.detail.value);
    var ad = this.data.ad;
    ad.ad_name = e.detail.value;
    this.setData({
      ad: ad,
    })
    this.query(ad.ad_name);
  },
  //点击遮罩关闭
  closeTanc: function () {
    this.setData({
      status: false
    })
  },
  //点击tip获取广告主
  getText: function (e) {
    var inputVal = e.currentTarget.dataset.text;
    var ad = this.data.ad;
    ad.ad_name = inputVal;
    this.setData({
      ad: ad,
      status: false
    })
  },
  /**
    * 弹窗
    */
  showDialogBtn: function () {
    var that = this;
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          showModal: true,
          modalDialogWidth: res.windowWidth - 25,
          modalDialogHeight: res.windowHeight - 80
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