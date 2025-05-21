// src/App.jsx
import React, { useEffect, useState } from "react";
import "./App.css";

const sources = ["1. 4474", "2. 대표번호", "3. 070"];

const getToday = () => {
  const offset = new Date().getTimezoneOffset();
  const localTime = new Date(Date.now() - offset * 60 * 1000);
  return localTime.toISOString().slice(0, 10);
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const today = getToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const [isEditingId, setIsEditingId] = useState(null);
  const [newTask, setNewTask] = useState({
    location: "",
    work: "",
    client: "",
    price: "",
    source: sources[0],
    memo: "",
    type: "작업",
  });

  useEffect(() => {
    const saved = localStorage.getItem("dailyTasks");
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("dailyTasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (newTask.type === "문의") {
      if (!newTask.source || !newTask.memo) return;
    } else {
      if (!newTask.location || !newTask.client || !newTask.price) return;
    }

    const priceNumber =
      newTask.type === "작업" ? parseInt(newTask.price, 10) || 0 : 0;
    const task = {
      id: Date.now().toString(),
      date: today,
      location: newTask.location,
      work: newTask.work,
      client: newTask.client,
      price: priceNumber * 10000,
      source: newTask.source,
      memo: newTask.memo,
      type: newTask.type,
      isHold: false,
      isDone: false,
    };
    setTasks((prev) => [...prev, task]);
    resetForm();
  };

  const editTask = () => {
    const priceNumber =
      newTask.type === "작업" ? parseInt(newTask.price, 10) || 0 : 0;
    const updated = tasks.map((t) =>
      t.id === isEditingId
        ? { ...t, ...newTask, price: priceNumber * 10000 }
        : t
    );
    setTasks(updated);
    resetForm();
  };

  const startEdit = (task) => {
    setIsEditingId(task.id);
    setNewTask({
      location: task.location,
      work: task.work,
      client: task.client,
      price: task.price / 10000,
      source: task.source,
      memo: task.memo || "",
      type: task.type || "작업",
    });
  };

  const resetForm = () => {
    setNewTask({
      location: "",
      work: "",
      client: "",
      price: "",
      source: sources[0],
      memo: "",
      type: "작업",
    });
    setIsEditingId(null);
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const holdTask = (id) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, isHold: true } : t)));
  };

  const restoreTask = (id) => {
    setTasks(
      tasks.map((t) =>
        t.id === id ? { ...t, isHold: false, isDone: false } : t
      )
    );
  };

  const completeTask = (id) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, isDone: true } : t)));
  };

  const totalSelectedDate = tasks
    .filter((t) => t.date === selectedDate && !t.isHold && t.type === "작업")
    .reduce((acc, cur) => acc + cur.price, 0);

  const totalMonthly = tasks
    .filter(
      (t) =>
        t.date.slice(0, 7) === selectedDate.slice(0, 7) &&
        !t.isHold &&
        t.type === "작업"
    )
    .reduce((acc, cur) => acc + cur.price, 0);

  const taskCount = tasks.filter(
    (t) => t.date === selectedDate && t.type === "작업"
  ).length;
  const inquiryCount = tasks.filter(
    (t) => t.date === selectedDate && t.type === "문의"
  ).length;

  const sourceStats = sources.map((source) => {
    const total = tasks
      .filter(
        (t) =>
          t.date === selectedDate &&
          t.source === source &&
          !t.isHold &&
          t.type === "작업"
      )
      .reduce((sum, t) => sum + t.price, 0);
    return { source, total };
  });

  return (
    <div className="container">
      <h1>작업일지 기록 📒</h1>

      <div className="form">
        <select
          value={newTask.type}
          onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
        >
          <option value="작업">작업</option>
          <option value="문의">문의</option>
        </select>
        {newTask.type === "작업" && (
          <>
            <input
              placeholder="지역명"
              value={newTask.location}
              onChange={(e) =>
                setNewTask({ ...newTask, location: e.target.value })
              }
            />
            <input
              placeholder="작업내용"
              value={newTask.work}
              onChange={(e) => setNewTask({ ...newTask, work: e.target.value })}
            />
            <input
              placeholder="상호명"
              value={newTask.client}
              onChange={(e) =>
                setNewTask({ ...newTask, client: e.target.value })
              }
            />
            <input
              placeholder="금액 (예: 3 → 3만원)"
              type="number"
              value={newTask.price}
              onChange={(e) =>
                setNewTask({ ...newTask, price: e.target.value })
              }
            />
          </>
        )}
        <select
          value={newTask.source}
          onChange={(e) => setNewTask({ ...newTask, source: e.target.value })}
        >
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <textarea
          placeholder="기타 메모"
          value={newTask.memo}
          onChange={(e) => setNewTask({ ...newTask, memo: e.target.value })}
        ></textarea>
        {isEditingId ? (
          <>
            <button className="save" onClick={editTask}>
              저장하기 💾
            </button>
            <button onClick={resetForm}>취소</button>
          </>
        ) : (
          <button className="save" onClick={addTask}>
            추가하기 🍭
          </button>
        )}
      </div>

      <div className="list">
        <h2>
          <label>날짜 선택: </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </h2>
        <ul>
          {tasks
            .filter((t) => t.date === selectedDate)
            .map((task) => (
              <li
                key={task.id}
                className={`task-item ${task.isHold ? "hold" : ""} ${
                  task.isDone ? "done" : ""
                } ${task.type === "문의" ? "inquiry" : ""}`}
              >
                <div>
                  <strong>{task.location}</strong> - {task.work} ({task.client})
                  <br />
                  <small>
                    {task.type} | {task.source} | {task.price.toLocaleString()}
                    원{task.memo ? ` | 메모: ${task.memo}` : ""}
                  </small>
                </div>
                <div className="buttons">
                  {!task.isHold && !task.isDone ? (
                    <>
                      <button
                        className="hold"
                        onClick={() => holdTask(task.id)}
                      >
                        보류
                      </button>
                      <button
                        className="delete"
                        onClick={() => deleteTask(task.id)}
                      >
                        삭제
                      </button>
                      <button className="edit" onClick={() => startEdit(task)}>
                        수정
                      </button>

                      {task.type === "작업" && (
                        <button
                          className="complete"
                          onClick={() => completeTask(task.id)}
                        >
                          완료
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        className="restore"
                        onClick={() => restoreTask(task.id)}
                      >
                        취소
                      </button>
                      <button
                        className="delete"
                        onClick={() => deleteTask(task.id)}
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
        </ul>
        <div className="total">
          작업 건수: <span style={{ color: "red" }}>{taskCount}</span>건 | 문의
          건수: <span style={{ color: "red" }}>{inquiryCount}</span>건<br />
          총합:{" "}
          <span style={{ color: "red" }}>
            {totalSelectedDate.toLocaleString()}
          </span>
          원<br />
          월간 총합:{" "}
          <span style={{ color: "red" }}>{totalMonthly.toLocaleString()}</span>
          원
        </div>
      </div>

      <div className="stats">
        <h3>전화 경로별 통계</h3>
        <ul>
          {sourceStats.map((s) => (
            <li key={s.source}>
              {s.source}: {s.total.toLocaleString()}원
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
