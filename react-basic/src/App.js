// #144-#150 useState 是 React 的一个 Hook，它允许你在函数组件中添加状态
import { useState } from "react";
// 语法
// const [state, setState] = useState(initialState);

// #189-#337
// 用lodash库实现评论列表的排序功能，并实现删除评论功能。
import _ from "lodash"
// likes是按点赞数降序排列的，最新评论排在最前面。
// desc是按降序排序，asc是按升序排序。
// const [comments, setComments] = useState(_.orderBy(initialComments, "likes", "desc"));

// #189-#337
// classNames是一个帮助我们管理样式的库，可以方便的管理样式类名。
import classNames from 'classnames'

// function App() {
//   return (
//     <div className="App">

//     </div>
//   );
// }



// ###################################### Day1 8/15
// const count = 100;

// function getName(){
//   return "John";
// }

// function App() {
//   return (
//     <div className="App">
//       this is App
//       {/* 使用引号传递字符串 */}
//       {'this is message'}
//       {/* 识别js变量 */}
//       {count}
//       {/* 调用js函数 */}
//       {getName()}
//       {/* 方法调用 */}
//       {new Date().getDate()}
//       {/* jsx元素 使用js对象 */}
//       <div style={{color:'red'}}>this is div</div>
//     </div>
//   );
// }

// 使用map方法遍历渲染列表
// const list = [{ id: 1, name: 'John', age: 25, city: 'New York' }, { id: 2, name: 'Mary', age: 30, city: 'Los Angeles' }];
// function App() {
//   return (
//     <div className="App">
//       this is App
//       {/* 渲染列表 */}
//       {/* <ul>{list.map(item => <li>vue</li>)}</ul> */}
//       <ul>{list.map(item => <li key={item.id}>{item.name} - {item.age} - {item.city}</li>)}</ul>
//     </div>
//   );
// }

// 基础的条件渲染,逻辑与运算（&&），三元表达式（？：）
// const isLogin = true
// function App() {
//   return (
//     <div className="App">
//       {/* 逻辑 */}
//       {isLogin && <span>this is span</span>}
//       {/* 三元表达式 */}
//       {isLogin ? <span>   true</span> : <span>false</span>}
//     </div>
//   );
// }

// 复杂一点的条件渲染
// const articleType = 3

// function getArticleTem() {
//   if (articleType === 0) {
//     return "无图文章"
//   } else if (articleType === 1) {
//     return "单图文章"
//   } else {
//     return "三图文章"
//   }
// }
// function App() {
//   return (
//     <div className="App">
//       {/* 复杂的条件渲染 */}
//       {getArticleTem()}
//     </div>
//   );
// }

// 基础事件绑定
// function App() {
//   const test = 'sss'
// const handleClick = () => {
//   console.log('click被点击了')
// }
// 事件参数e
// const handleClick = (e) => {
//   console.log('click被点击了',e)
// }

// 传递自定义参数    () => handleClick(test)
// const handleClick = (name) => {
//   console.log('click被点击了',name)
// }
// 同时都想要传递自定义参数
//   const handleClick = (e, name) => {
//     console.log('click被点击了', e, name)
//   }

//   return (
//     <div className="App">
//       {/* <button onClick={handleClick}>click me</button> */}
//       <button onClick={(e) => handleClick(e,test)}>click me</button>
//     </div>
//   );
// }

// 组件渲染
// function Button() {
//   return <button>Click me</button>
// }
// 箭头函数的写法
// const Button=()=> {
//   return <button>Click me</button>
// }
// function App() {
//   return (
//     <div className="App">
//       <Button />
//       <Button ></Button>
//     </div>
//   );
// }

// useState的基础使用
// import { useState } from "react";
// function App() {
//   // 添加一个状态变量
//   // count 状态变量
//   // setCount 状态更新函数的方法
//   const [count, setCount] = useState(0)
//   // 点击事件回调
//   const handleClick = () => {
//     // 作用：修改count状态变量，重新渲染组件
//     setCount(count + 1)

//     // 直接修改，无法引发试图更新
//     // count++
//     // console.log(count)
//   }
//   const [form, setForm] = useState({ name: 'John' })
//   const changeForm = () => {
//     // 错误
//     // form.name = 'Mary'
//     // 正确
//     setForm({ ...form, name: 'Mary' })
//   }
//   return (
//     <div>
//       <button onClick={handleClick}>{count}</button>
//       <button onClick={changeForm}>修改了 {form.name}</button>
//     </div>
//   );
// }



// 基础样式控制
// import './index.css';
// function App() {
//   return (
//     <div className="App">
//       {/* 行内的样式控制 */}
//       <span style={{ color: 'red', fontSize: '50px' }}>this is red text</span>
//       {/* 通过className控制样式 */}
//       <span className="foo">this is red text</span>
//     </div>
//   );
// }


/**
 * 
 * 一个小项目：评论列表
 * 
*/

// 初始评论列表
// const initialComments = [
//   {
//     id: 1,
//     username: "jack",
//     content: "这是一条评论回复",
//     date: "2023-11-11",
//     likes: 100,
//     isOwner: true,
//   },
//   {
//     id: 2,
//     username: "mary",
//     content: "这是另一条评论回复",
//     date: "2023-11-12",
//     likes: 50,
//     isOwner: false,
//   },
//   {
//     id: 3,
//     username: "mary",
//     content: "这是另一条评论回复",
//     date: "2023-12-12",
//     likes: 50,
//     isOwner: false,
//   },
// ];

// function App() {
//   // const [comments, setComments] = useState(_.orderBy(initialComments, "date", "desc"));
//   // 在242已经给他排序了所以不需要用到上面的lodash库了。
//   const [comments, setComments] = useState(initialComments);
//   const [newComment, setNewComment] = useState("");
//   const [sortType, setSortType] = useState("latest");

//   // 处理删除评论
//   const handleDelete = (id) => {
//     setComments(comments.filter((comment) => comment.id !== id));
//   };

//   // 处理发布新评论
//   const handleSubmit = () => {
//     if (newComment.trim() === "") return;

//     const newCommentObject = {
//       id: comments.length + 1, // 简单生成新ID
//       username: "你的用户名", // 假设当前用户是你
//       content: newComment,
//       date: new Date().toISOString().split("T")[0], // 当前日期
//       likes: 0, // 新评论初始点赞数
//       isOwner: true, // 你是评论的拥有者
//     };

//     setComments([...comments, newCommentObject]);
//     setNewComment(""); // 清空输入框
//   };

//   // 按照选中的排序方式排序评论
//   const sortedComments = [...comments].sort((a, b) => {
//     if (sortType === "latest") {
//       return new Date(b.date) - new Date(a.date);
//     } else {
//       return b.likes - a.likes;
//     }
//   });

//   // const tabs = [{ type: 'hot', text: '最热' }, { type: 'time', text: '最新' }]
//   // const [type, setType] = useState('hot')
//   // const handleTabChange = (type) => {
//   //   console.log(type);
//   //   setType(type)
//   // }

//   return (
//     <div className="App" style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
//       <div style={{ marginBottom: "20px" }}>
//         <textarea
//           value={newComment}
//           onChange={(e) => setNewComment(e.target.value)}
//           placeholder="发一条友善的评论"
//           style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
//         />
//         <button
//           onClick={handleSubmit}
//           style={{ marginTop: "10px", padding: "10px 20px", backgroundColor: "#00bfff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
//         >
//           发布
//         </button>
//       </div>
//       <div style={{ marginBottom: "20px" }}>
//         <button
//           onClick={() => setSortType("latest")}
//           style={{ marginRight: "10px", padding: "10px 20px", backgroundColor: sortType === "latest" ? "#00bfff" : "#eee", color: sortType === "latest" ? "white" : "black", border: "none", borderRadius: "5px", cursor: "pointer" }}
//         >
//           最新
//         </button>
//         <button
//           onClick={() => setSortType("hottest")}
//           style={{ padding: "10px 20px", backgroundColor: sortType === "hottest" ? "#00bfff" : "#eee", color: sortType === "hottest" ? "white" : "black", border: "none", borderRadius: "5px", cursor: "pointer" }}
//         >
//           最热
//         </button>

//         {/* 跟这个原本的有区别，要修改下面的代码 */}
//         {/* <div className="nav-sort">
//           高亮类名：active
//           {tabs.map(item => (
//             <button
//               key={item.type}
//               onClick={() => handleTabChange(item.type)}
//             // className={`nav-item ${type === item.type && 'active'}`}
//             className={classNames('nav-item', { active: type === item.type })}
//             >
//               {item.text}
//             </button>
//           ))}
//         </div> */}

//       </div>
//       <div>
//         {sortedComments.map((comment) => (
//           <div key={comment.id} style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
//             <div>
//               <strong>{comment.username}</strong>
//             </div>
//             <div style={{ margin: "5px 0" }}>{comment.content}</div>
//             <div style={{ fontSize: "12px", color: "#999" }}>
//               <span>{comment.date}</span> | <span>点赞数: {comment.likes}</span>
//               {comment.isOwner && (
//                 <button
//                   onClick={() => handleDelete(comment.id)}
//                   style={{ marginLeft: "10px", color: "#ff4d4f", backgroundColor: "transparent", border: "none", cursor: "pointer" }}
//                 >
//                   删除
//                 </button>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }



// ###################################### Day2 8/16
function App() {
  return (
    <div className="App">

    </div>
  );
}

export default App;



// 用lodash库实现评论列表的排序功能，并实现删除评论功能。

// import _ from "lodash"
// likes是按点赞数降序排列的，最新评论排在最前面。
// desc是按降序排序，asc是按升序排序。
// const [comments, setComments] = useState(_.orderBy(initialComments, "likes", "desc"));


// 类名控制
{/* <span 
  key={item.type}
  onClick={() => handleTabChange(item.type)}
  className={`nav-item ${type === item.type && 'active'}`}
>
  {item.text}
</span> */}

// key={item.type}：
// 这个 key 属性为每个 <span> 元素提供了唯一标识，这是在 React 中渲染列表时的一种优化机制，确保列表在更新时高效地对比和处理元素。

// onClick={() => handleTabChange(item.type)}：
// 该事件处理函数在点击 <span> 元素时触发，调用 handleTabChange 方法并传入 item.type 作为参数，这通常用于切换选项卡或更新状态。

// className={nav-item ${type === item.type && 'active'}}：
// 这里使用模板字符串 (template literals) 动态生成 className。
// nav-item 是静态类名，无论什么情况都会被应用。
// ${type === item.type && 'active'} 部分根据条件 type === item.type 的结果来决定是否添加 active 类名。type === item.type 返回 true 时，将 'active' 追加到 className 中，否则不会添加。

// 跟这个原本的有区别，要修改下面的代码：
// classNames是一个帮助我们管理样式的库，可以方便的管理样式类名。
// import classNames from 'classnames'
// className={classNames('nav-item', { active: type === item.type })}
// classnames 是一个帮助我们根据条件来动态控制类名的 JavaScript 库。这里展示了如何通过 classnames 来改进前面的代码。

// 'nav-item'：
// 这是静态类名，不论条件如何变化都会被应用。

// { active: type === item.type }：
// 这是一个对象，key 是要控制的类名 (active)，而 value 是条件 (type === item.type)。
// 当条件为 true 时，classnames 会将 active 类名添加到元素中；如果条件为 false，则不会添加。
