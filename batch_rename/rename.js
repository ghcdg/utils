const fs = require('fs')
const path = require('path')


class RenameObj{

  constructor(renamePath){
    this.renamePath = renamePath
    this.pathArr = getDataInterface() || []
  }

  /**
   * @param {callback} the rename function that called mapping by user called
   * @param {description}  the description about file rename,  parameters passed in by user
   * description: reference string (Array or String),replacement string
   */
  rnCommonOperation(callback,description){
    let that = this
    // get one path from this.pathArr
    that.pathArr.forEach(filePath => {
      // get one filename from file path
      let fileArr = getFileArr(filePath)
      fileArr.forEach(fileName => {
        // rename operation
        callback(fileName,description)
      })
    })
  }

  rnSelf(ref,rp){
    let description = {ref: ref, rp: rp}
    this.rnCommonOperation(renameSelf,description)
  }
  renameSelf(oldfn,description){
    let { ref,rp } = description
    let reg = new RegExp(ref)
    return oldfn.replace(reg,() => rp)
  }

}

function getDataInterface(){
  let result = []
  try{
    result = getPathContainFile()
  }catch(err){
    console.log("get path error!")
  }
  return result;
}

// let renamePath = ''
// let rnobj = new RenameObj(renamePath)
// rnobj.rnSelf("","")
