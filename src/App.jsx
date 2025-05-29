// src/App.jsx
import React, { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import "./App.css";

const sources = ["4474", "대표번호", "타지역"];
const workOptions = [
  "변기막힘",
  "싱크대막힘",
  "하수구막힘",
  "부속교체",
  "누수",
  "기타",
];

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getToday = () => formatDate(new Date());

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [isEditingId, setIsEditingId] = useState(null);
  const [newTask, setNewTask] = useState({
    location: "",
    work: workOptions[0],
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
      newTask.type === "작업" ? parseFloat(newTask.price) || 0 : 0;
    const task = {
      id: Date.now().toString(),
      date: getToday(),
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
      newTask.type === "작업" ? parseFloat(newTask.price) || 0 : 0;
    const updated = tasks.map((t) =>
      t.id === isEditingId
        ? { ...t, ...newTask, price: priceNumber * 10000 }
        : t
    );
    setTasks(updated);
    resetForm();
  };

  const resetForm = () => {
    setNewTask({
      location: "",
      work: workOptions[0],
      client: "",
      price: "",
      source: sources[0],
      memo: "",
      type: "작업",
    });
    setIsEditingId(null);
  };

  const filteredTasks = tasks.filter(
    (t) => formatDate(t.date) === selectedDate
  );

  const downloadCSV = () => {
    const thisMonth = selectedDate.slice(0, 7);
    const selectedDateObj = new Date(selectedDate);
    const filtered = tasks.filter((t) => {
      const taskDate = new Date(t.date);
      return (
        formatDate(t.date).slice(0, 7) === thisMonth &&
        taskDate <= selectedDateObj
      );
    });

    if (filtered.length === 0) {
      alert("이번 달 내역이 없습니다 😅");
      return;
    }

    const csvData = filtered.map((t) => ({
      날짜: formatDate(t.date),
      구분: t.type,
      지역: t.location,
      작업내용: t.work,
      상호명: t.client,
      금액: t.price,
      전화경로: t.source,
      메모: t.memo,
      보류: t.isHold ? "O" : "",
      완료: t.isDone ? "O" : "",
    }));

    const csv = Papa.unparse(csvData);
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `jobbook_${thisMonth}_1일~${selectedDate}.csv`);
  };

  const chartData = (() => {
    const daily = {};
    tasks.forEach((t) => {
      if (t.type === "작업" && !t.isHold) {
        const date = formatDate(t.date);
        daily[date] = (daily[date] || 0) + t.price;
      }
    });
    return Object.entries(daily).map(([date, total]) => ({ date, total }));
  })();

  const pieData = sources.map((source) => {
    const total = tasks
      .filter((t) => t.source === source && t.type === "작업" && !t.isHold)
      .reduce((sum, t) => sum + t.price, 0);
    return { name: source, value: total };
  });

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658"];

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
            <select
              value={newTask.work}
              onChange={(e) => setNewTask({ ...newTask, work: e.target.value })}
            >
              {workOptions.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
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
        <button className="save" onClick={addTask}>
          추가하기 🍭
        </button>
        <button onClick={downloadCSV}>CSV 다운로드 💾</button>
      </div>

      <div style={{ width: "100%", height: 300, marginTop: 30 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#8884d8"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ width: 300, height: 300, margin: "auto", marginTop: 40 }}>
        <PieChart width={300} height={300}>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius={100}
            dataKey="value"
            label
          >
            {pieData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>
    </div>
  );
}
