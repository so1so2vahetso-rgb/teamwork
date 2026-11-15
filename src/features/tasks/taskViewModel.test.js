import test from 'node:test'
import assert from 'node:assert/strict'
import {isOverdue,filterTasks,summarizeTasks} from './taskViewModel.js'
const items=[{id:'a',title:'Thiết kế đăng nhập',assigneeId:'an',status:'todo',dueDate:'2026-11-14'},{id:'b',title:'Viết báo cáo',assigneeId:'binh',status:'doing',dueDate:'2026-11-16'},{id:'c',title:'Kiểm tra',assigneeId:'an',status:'done',dueDate:'2026-11-10'}]
test('Vietnam midnight boundary and completed work determine overdue',()=>{
 assert.equal(isOverdue(items[0],new Date('2026-11-14T16:59:59Z')),false)
 assert.equal(isOverdue(items[0],new Date('2026-11-14T17:00:00Z')),true)
 assert.equal(isOverdue(items[2],new Date('2026-11-14T17:00:00Z')),false)
})
test('search supports Vietnamese text and combining independent filters',()=>{
 assert.deepEqual(filterTasks(items,{search:'DANG NHAP',assignee:'an',status:'todo'}).map(x=>x.id),['a'])
 assert.deepEqual(filterTasks(items,{assignee:'an',status:'doing'}),[])
})
test('progress derives from all filtered records with safe empty totals',()=>{
 assert.deepEqual(summarizeTasks(items),{total:3,todo:1,doing:1,done:1,percent:33})
 assert.deepEqual(summarizeTasks([]),{total:0,todo:0,doing:0,done:0,percent:0})
})
