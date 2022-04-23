$(function () {
  var layer = layui.layer
  var form = layui.form
  var laypage = layui.laypage

  // 定义美化时间的过滤器
  template.defaults.imports.dateFormate = function (date) {
    const dt = new Date(date)
    var y = dt.getFullYear()
    var m = padZero(dt.getMonth() + 1)
    var d = padZero(dt.getDate())

    var hh = padZero(dt.getHours())
    var mm = padZero(dt.getMinutes())
    var ss = padZero(dt.getSeconds())

    return y + "-" + m + "-" + d + "" + hh + ":" + mm + ":" + ss
  }

  // 定义补零的函数
  function padZero (n) {
    return n > 9 ? n : "0" + n
  }

  // 定义一个查询的对象，将来请求数据的时候，
  // 需要将请求参数对象提交到服务器
  var q = {
    pagenum: 1, // 页码值，默认请求第一页的数据
    pagesize: 2, // 每页显示几条数据，默认每页显示2条
    cate_id: "", // 文章分类的Id
    state: "" // 文章的发布状态
  }

  initTable()
  initCate()

  // 获取文章列表数据的方法
  function initTable () {
    $.ajax({
      method: "GET",
      url: "/my/article/list",
      data: q,
      success: function (res) {
        if (res.status !== 0) {
          return layer.msg("获取文章列表失败！")
        }
        // 使用模板引擎渲染页面的数据
        var htmlStr = ("tpl-table", res)
        $("tbody").html(htmlStr)
        // 调用渲染分页的方法
        renderPage(res.total)
      }
    })
  }

  // 初始化文章分类的方法
  function initCate () {
    $.ajax({
      method: "GET",
      url: "/my/article/cates",
      success: function (res) {
        if (res.status !== 0) {
          return layer.msg("获取分类数据失败！")
        }
        // 调用模板引擎渲染分类的可选项
        var htmlStr = template("tpl-cate", res)
        $("[name=cate_id]").html(htmlStr)
        // 通知layui重新渲染表单区域的UI结构
        form.render()
      }
    })
  }

  // 为筛选表单绑定submit事件
  $("#form-search").on("submit", function (e) {
    e.preventDefault()
    // 获取表单中选中项的值
    var cate_id = $("[name=cate_id]").val()
    var state = $("[name=state]").val()
    // 为查询参数对象q中对应的属性赋值
    q.cate_id = cate_id
    q.state = state
    // 根据最新的筛选条件，重新渲染表格的数据
    initTable()
  })

  // 定义渲染分页的方法
  function renderPage (total) {
    // 调用laypage.render()方法来渲染分页的
    laypage.render({
      // 分页容器的Id
      elem: "pageBox",
      // 总数据条红绳
      count: total,
      // 每页显示几条数据
      limit: q.pagesize,
      // 设置默认被选中的分页
      curr: q.pagenum,
      layout: ["count", "limit", "prev", "page", "next", "skip"],
      limits: [2, 3, 5, 10],
      // 分页发生切换的时候，触发jump回调
      // 触发jump回调的方式有两种：
      // 1. 点击页码的时候会触发jump回调
      // 2. 只要调用了laypage.render()方法，就会触发jump回调

      jump: function (obj, first) {
        // 可以通过first的值，来判断是通过哪种方式，触发的jump回调
        // 如果是first的值为true，证明是方式2触发的
        // 否则就是方式1触发的
        // 把最新的页码值，赋值到q这个查询参数对象中
        q.pagenum = obj.q.pagesize = obj.limit // 把最新的条目数，赋值到q这个查询参数对象中
        // 根据最新的q获取对应的数据列表并渲染表格
        if (!first) {
          initTable()
        }
      }
    })
  }

  // 通过代理的形式，为删除按钮绑定点击事件处理函数
  $("tbody").on("click", ".btn-delete", function () {
    // 获取删除按钮的个数
    var len = $(".btn-delete").length
    // 获取到文章的id
    var id = $(this).attr("data-id")
    // 询问用户是否要删除数据
    layer.confirm("确认删除?", { icon: 3, title: "提示" }, function (index) {
      //do something
      $.ajax({
        method: "GET",
        url: "/my/article/deletecate/" + id,
        success: function (res) {
          if (res.status !== 0) {
            return layer.msg("删除文章失败！")
          }
          layer.msg("删除文章成功！")
          // 当数据删除完成后，需要判断当前这一页中，是否还有剩余的数据
          // 如果没有剩余的数据了，则让页码值减1之后
          if (len === 1) {
            // 如果len的值等于1，证明删除完毕之后，页面上就没有任何数据了
            // 页码值最小值必须是1
            q.pagenum = q.pagenum === 1 ? 1 : q.pagenum - 1
          }
          // 重新加载表格中的数据
          initTable()
          layer.close(index)
        }
      })
    })
  })
})
