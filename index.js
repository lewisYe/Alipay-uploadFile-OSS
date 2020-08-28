import { uploadImage } from './utils/upload.js';

// 小程序的js文件中
Page({
  data: {
  },
  onLoad() {
  },
  upload(e) {
    uploadImage({
      count: 1
    }, (url) => {
      this.setData({ imgUrl: url })
    })
  }
});
