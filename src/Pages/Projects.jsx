import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  PROJECTS_DATA_KEY,
  PROJECT_TASKS_KEY,
  PROJECT_NOTIFICATIONS_KEY,
} from "../utils/storageKeys";

const initialProjects = [];
const initialTasks = [];

const columns = [
  { key: "todo", label: "To Do", color: "#f87171" },
  { key: "in-progress", label: "In Progress", color: "#facc15" },
  { key: "review", label: "In Review", color: "#60a5fa" },
  { key: "done", label: "Completed", color: "#34d399" },
];
const statusOrder = columns.map((column) => column.key);
const PRIORITY_SEQUENCE = ["low", "normal", "high"];
const NOTIFICATION_LIMIT = 40;

const readProjects = () => {
  if (typeof window === "undefined") return initialProjects;
  try {
    const stored = window.localStorage.getItem(PROJECTS_DATA_KEY);
    return stored ? JSON.parse(stored) : initialProjects;
  } catch {
    return initialProjects;
  }
};

const readTasks = () => {
  if (typeof window === "undefined") return initialTasks;
  try {
    const stored = window.localStorage.getItem(PROJECT_TASKS_KEY);
    const parsed = stored ? JSON.parse(stored) : initialTasks;
    return parsed.map((task) => ({
      priority: "normal",
      ...task,
      attachment: task.attachment || null,
    }));
  } catch {
    return initialTasks;
  }
};

const readTaskNotifications = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(PROJECT_NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const formatDateLabel = (isoString) => {
  if (!isoString) return "No date";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatRelativeDueDate = (isoString) => {
  if (!isoString) return "No due date";
  const now = new Date();
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "No due date";
  const diffDays = Math.round((date - now) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays < 0) return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} late`;
  return `In ${diffDays} day${diffDays === 1 ? "" : "s"}`;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export default function Projects() {
  const [projects, setProjects] = useState(() => readProjects());
  const [tasks, setTasks] = useState(() => readTasks());
  const [selectedProject, setSelectedProject] = useState("All");
  const [newProject, setNewProject] = useState({
    name: "",
    client: "",
    budget: "",
    notes: "",
  });
  const [newTask, setNewTask] = useState({
    title: "",
    projectId: "",
    assignee: "",
    hours: "",
    priority: "normal",
    dueDate: "",
    attachment: null,
  });
  const [taskAttachmentResetKey, setTaskAttachmentResetKey] = useState(() => Date.now());
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [taskSearch, setTaskSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [focusedDeveloper, setFocusedDeveloper] = useState("");
  const [taskNotifications, setTaskNotifications] = useState(() => readTaskNotifications());
  const [copiedNotificationId, setCopiedNotificationId] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PROJECTS_DATA_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PROJECT_TASKS_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      PROJECT_NOTIFICATIONS_KEY,
      JSON.stringify(taskNotifications)
    );
  }, [taskNotifications]);

  const projectsWithStats = useMemo(
    () =>
      projects.map((project) => {
        const projectTasks = tasks.filter((task) => task.projectId === project.id);
        const completed = projectTasks.filter((task) => task.status === "done").length;
        const hours = projectTasks.reduce(
          (sum, task) => sum + Number(task.hours || 0),
          0
        );
        return {
          ...project,
          tasksTotal: projectTasks.length,
          tasksCompleted: completed,
          hours,
        };
      }),
    [projects, tasks]
  );

  const visibleTasks = useMemo(() => {
    return tasks
      .filter((task) =>
        selectedProject === "All" ? true : task.projectId === Number(selectedProject)
      )
      .filter((task) =>
        statusFilter === "all" ? true : task.status === statusFilter
      )
      .filter((task) =>
        priorityFilter === "all" ? true : (task.priority || "normal") === priorityFilter
      )
      .filter((task) => {
        if (!taskSearch.trim()) return true;
        const haystack = `${task.title} ${task.assignee}`.toLowerCase();
        return haystack.includes(taskSearch.toLowerCase());
      });
  }, [tasks, selectedProject, taskSearch, statusFilter, priorityFilter]);

  const tasksByColumn = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        tasks: visibleTasks.filter((task) => task.status === column.key),
      })),
    [visibleTasks]
  );

  const columnStats = useMemo(
    () =>
      columns.map((column) => {
        const tasksInColumn = tasks.filter((task) => task.status === column.key);
        const hours = tasksInColumn.reduce(
          (sum, task) => sum + Number(task.hours || 0),
          0
        );
        return {
          key: column.key,
          label: column.label,
          count: tasksInColumn.length,
          hours,
        };
      }),
    [tasks]
  );

  const buildNotificationContent = (task, stage, projectName) => {
    const dueLabel = task.dueDate ? formatDateLabel(task.dueDate) : "no due date";
    if (stage === "review") {
      return {
        subject: `${projectName}: ${task.title} ready for review`,
        body: `Hi team,\n\n${task.assignee || "Our developer"} just moved "${
          task.title
        }" into review for ${projectName}. ${
          task.hours ? `${task.hours} hour(s)` : "Time"
        } have been logged so far${
          task.dueDate ? ` and it was scheduled for ${dueLabel}` : ""
        }.\n\nPlease take a look and reply with any changes so we can keep the sprint on track.\n\nThanks!`,
        headline: "Review email drafted",
      };
    }
    return {
      subject: `${projectName}: ${task.title} completed`,
      body: `Hello,\n\n${task.assignee || "The team"} has completed "${
        task.title
      }" for ${projectName}. ${
        task.hours ? `${task.hours} hour(s)` : "Work"
      } were logged, and assets are ready for delivery${
        task.attachment ? ` (reference file: ${task.attachment.name})` : ""
      }.\n\nLet us know if you need anything else before we move this to billing.\n\nCheers!`,
      headline: "Completion email drafted",
    };
  };

  const triggerTaskNotification = (task, nextStatus) => {
    if (!["review", "done"].includes(nextStatus)) return;
    const stage = nextStatus === "review" ? "review" : "complete";
    const projectName =
      projects.find((project) => project.id === task.projectId)?.name || "Project";
    const content = buildNotificationContent(task, stage, projectName);
    const entry = {
      id: Date.now(),
      taskId: task.id,
      projectName,
      taskTitle: task.title,
      stage,
      subject: content.subject,
      body: content.body,
      headline: content.headline,
      timestamp: new Date().toISOString(),
    };
    setTaskNotifications((prev) => [entry, ...prev].slice(0, NOTIFICATION_LIMIT));
  };

  const handleCopyNotification = async (notification) => {
    if (!notification) return;
    try {
      await navigator.clipboard?.writeText(notification.body);
      setCopiedNotificationId(notification.id);
      setTimeout(() => setCopiedNotificationId(null), 2000);
    } catch (err) {
      console.error("Unable to copy notification", err);
      window.alert("Unable to copy email text. Please copy manually.");
    }
  };

  const handleClearNotifications = () => {
    if (!taskNotifications.length) return;
    if (!window.confirm("Clear the notification log?")) return;
    setTaskNotifications([]);
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    setProjects((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newProject.name.trim(),
        client: newProject.client.trim() || "Client",
        budget: Number(newProject.budget) || 0,
        status: "Planning",
        notes: newProject.notes || "",
      },
    ]);
    setNewProject({ name: "", client: "", budget: "", notes: "" });
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.projectId) return;
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: newTask.title.trim(),
        projectId: Number(newTask.projectId),
        assignee: newTask.assignee.trim(),
        hours: Number(newTask.hours) || 0,
        status: "todo",
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        attachment: newTask.attachment,
      },
    ]);
    setNewTask({
      title: "",
      projectId: "",
      assignee: "",
      hours: "",
      priority: "normal",
      dueDate: "",
      attachment: null,
    });
    setTaskAttachmentResetKey(Date.now());
  };

  const handleRemoveProject = (projectId) => {
    if (!window.confirm("Remove project and its tasks?")) return;
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
    setTasks((prev) => prev.filter((task) => task.projectId !== projectId));
    if (String(selectedProject) === String(projectId)) {
      setSelectedProject("All");
    }
  };

  const handleRemoveTask = (taskId) => {
    if (!window.confirm("Remove task?")) return;
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const handleTaskAttachmentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setNewTask((prev) => ({ ...prev, attachment: null }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setNewTask((prev) => ({
        ...prev,
        attachment: {
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: reader.result,
          uploadedAt: new Date().toISOString(),
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDragStart = (taskId) => setDraggedTaskId(taskId);

  const handleDrop = (status) => {
    if (!draggedTaskId) return;
    let triggeredTask = null;
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== draggedTaskId || task.status === status) return task;
        triggeredTask = task;
        return { ...task, status };
      })
    );
    setDraggedTaskId(null);
    if (triggeredTask) {
      triggerTaskNotification(triggeredTask, status);
    }
  };

  const handleClearProjects = () => {
    if (!window.confirm("Clear all projects and tasks?")) return;
    setProjects([]);
    setTasks([]);
  };

  const handleQuickStatusChange = (taskId, direction = "forward") => {
    let triggeredTask = null;
    let triggeredStatus = null;
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const currentIndex = statusOrder.indexOf(task.status);
        if (currentIndex === -1) return task;
        const nextIndex =
          direction === "back"
            ? Math.max(0, currentIndex - 1)
            : Math.min(statusOrder.length - 1, currentIndex + 1);
        const nextStatus = statusOrder[nextIndex];
        if (nextStatus !== task.status) {
          triggeredTask = task;
          triggeredStatus = nextStatus;
        }
        return { ...task, status: nextStatus };
      })
    );
    if (triggeredTask && triggeredStatus) {
      triggerTaskNotification(triggeredTask, triggeredStatus);
    }
  };

  const handleCyclePriority = (taskId) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const currentIndex = PRIORITY_SEQUENCE.indexOf(task.priority || "normal");
        const nextIndex = (currentIndex + 1) % PRIORITY_SEQUENCE.length;
        return { ...task, priority: PRIORITY_SEQUENCE[nextIndex] };
      })
    );
  };

  const handleMarkComplete = (taskId) => {
    let completedTask = null;
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        completedTask = task;
        return { ...task, status: "done" };
      })
    );
    if (completedTask) {
      triggerTaskNotification(completedTask, "done");
    }
  };

  const handleSelectProjectCard = (projectId) => {
    setSelectedProject(String(projectId));
  };

  const developerSummary = useMemo(() => {
    const map = tasks.reduce((acc, task) => {
      if (!task.assignee) return acc;
      if (!acc[task.assignee]) acc[task.assignee] = { hours: 0, completed: 0, total: 0 };
      acc[task.assignee].hours += Number(task.hours) || 0;
      acc[task.assignee].total += 1;
      if (task.status === "done") acc[task.assignee].completed += 1;
      return acc;
    }, {});
    return Object.entries(map).map(([name, stats]) => ({ name, ...stats }));
  }, [tasks]);

  useEffect(() => {
    if (!focusedDeveloper && developerSummary.length > 0) {
      setFocusedDeveloper(developerSummary[0].name);
    }
  }, [developerSummary, focusedDeveloper]);

  const focusedTasks = useMemo(() => {
    if (!focusedDeveloper) return [];
    return tasks.filter((task) => task.assignee === focusedDeveloper);
  }, [tasks, focusedDeveloper]);

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter((task) => task.status === "in-progress").length;
    const completed = tasks.filter((task) => task.status === "done").length;
    const hours = tasks.reduce((sum, task) => sum + Number(task.hours || 0), 0);
    return { total, inProgress, completed, hours };
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    const today = new Date();
    return tasks
      .filter(
        (task) =>
          task.dueDate &&
          new Date(task.dueDate).getTime() < today.getTime() &&
          task.status !== "done"
      )
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    const today = new Date();
    return tasks
      .filter(
        (task) =>
          task.dueDate && new Date(task.dueDate).getTime() >= today.getTime()
      )
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 6);
  }, [tasks]);

  const statusBreakdown = useMemo(
    () =>
      columns.map((column) => {
        const count = tasks.filter((task) => task.status === column.key).length;
        const percent = taskStats.total
          ? Math.round((count / taskStats.total) * 100)
          : 0;
        return { ...column, count, percent };
      }),
    [tasks, taskStats.total]
  );

  const totalBudget = useMemo(
    () =>
      projects.reduce((sum, project) => sum + (Number(project.budget) || 0), 0),
    [projects]
  );

  const heroMetrics = [
    { label: "Active projects", value: projects.length },
    { label: "Scheduled hours", value: taskStats.hours.toFixed(1) },
    { label: "Open tasks", value: taskStats.total },
    { label: "Overdue items", value: overdueTasks.length },
  ];

  const boardSummary = {
    visible: visibleTasks.length,
    developers: developerSummary.length,
  };

  return (
    <div className="projects-page">
      <div className="container">
        <section className="projects-hero">
          <div className="projects-hero__content">
            <p className="eyebrow">Projects · Tasks · Time Tracking</p>
            <h1>Ship every client engagement with clarity</h1>
            <p className="muted hero-lede">
              Add projects, capture tasks, and see exactly where each build sits. Drag cards,
              highlight developers, and turn the data into quotes or invoices instantly.
            </p>
            <div className="projects-hero__actions">
              <Link to="/quote" className="btn btn-primary">
                Build quote
              </Link>
              <Link to="/invoice" className="btn btn-ghost">
                Invoice workspace
              </Link>
              <button className="btn btn-danger" type="button" onClick={handleClearProjects}>
                Clear workspace
              </button>
            </div>
          </div>
          <div className="projects-hero__stats">
            {heroMetrics.map((metric) => (
              <div className="projects-stat" key={metric.label}>
                <p className="muted small">{metric.label}</p>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="projects-overview">
          <div className="projects-overview__card">
            <div className="projects-overview__card-header">
              <h3>Workload mix</h3>
              <span className="muted small">{taskStats.total} total tasks</span>
            </div>
            <div className="projects-status-bar">
              {statusBreakdown.map((status) => (
                <span
                  key={status.key}
                  className="projects-status-bar__segment"
                  style={{
                    width: `${status.percent}%`,
                    backgroundColor: status.color,
                  }}
                ></span>
              ))}
            </div>
            <ul className="projects-status-legend">
              {statusBreakdown.map((status) => (
                <li key={status.key}>
                  <span className="status-dot" style={{ backgroundColor: status.color }}></span>
                  {status.label}
                  <strong>{status.count}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div className="projects-overview__card">
            <h3>Sprint snapshot</h3>
            <ul className="projects-metrics">
              <li>
                <strong>{upcomingTasks.length}</strong>
                <span className="muted small">Upcoming deadlines</span>
              </li>
              <li>
                <strong>{overdueTasks.length}</strong>
                <span className="muted small">Overdue items</span>
              </li>
              <li>
                <strong>{taskStats.inProgress}</strong>
                <span className="muted small">In progress</span>
              </li>
            </ul>
          </div>
          <div className="projects-overview__card">
            <h3>Financial coverage</h3>
            <p className="muted small">
              {projects.length} active project{projects.length === 1 ? "" : "s"}
            </p>
            <strong>{formatCurrency(totalBudget)}</strong>
            <span className="muted small">Budget under management</span>
            <p className="muted small">
              Avg. hours per task: {taskStats.total ? (taskStats.hours / taskStats.total).toFixed(1) : "0"} hrs
            </p>
          </div>
        </section>

        <section className="projects-workspace">
          <div className="projects-planner">
            <div className="projects-card projects-card--form">
              <div className="projects-form__header">
                <div>
                  <h3>Plan new project</h3>
                  <p className="muted small">
                    Tie quotes to execution. Capture client, budget, and notes in seconds.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  onClick={() => setNewProject({ name: "", client: "", budget: "", notes: "" })}
                >
                  Clear fields
                </button>
              </div>
              <form className="projects-form__grid" onSubmit={handleAddProject}>
                <label>
                  <span>Project name</span>
                  <input
                    className="input control"
                    placeholder="e.g., Commerce Portal build"
                    value={newProject.name}
                    onChange={(e) =>
                      setNewProject((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Client</span>
                  <input
                    className="input control"
                    placeholder="Client"
                    value={newProject.client}
                    onChange={(e) =>
                      setNewProject((prev) => ({ ...prev, client: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Budget ($)</span>
                  <input
                    className="input control"
                    type="number"
                    placeholder="2500"
                    value={newProject.budget}
                    onChange={(e) =>
                      setNewProject((prev) => ({ ...prev, budget: e.target.value }))
                    }
                  />
                </label>
               <label className="projects-form__full">
                  <span>Notes</span>
                  <textarea
                    className="input control"
                    rows={2}
                    placeholder="Scope, deliverables, approvals"
                    value={newProject.notes || ""}
                    onChange={(e) =>
                      setNewProject((prev) => ({ ...prev, notes: e.target.value }))
                    }
                  />
                </label>
                <button className="btn btn-primary projects-form__cta" type="submit">
                  Add project
                </button>
              </form>
            </div>

            <div className="projects-card projects-card--form">
              <div className="projects-form__header">
                <div>
                  <h3>Log task</h3>
                  <p className="muted small">
                    Assign a developer, set hours, pick a due date, and it hits the board immediately.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  onClick={() => {
                    setNewTask({
                      title: "",
                      projectId: "",
                      assignee: "",
                      hours: "",
                      priority: "normal",
                      dueDate: "",
                      attachment: null,
                    });
                    setTaskAttachmentResetKey(Date.now());
                  }}
                >
                  Clear fields
                </button>
              </div>
              <form className="projects-form__grid" onSubmit={handleAddTask}>
                <label>
                  <span>Task title</span>
                  <input
                    className="input control"
                    placeholder="Design hero animation"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Project</span>
                  <select
                    className="input control"
                    value={newTask.projectId}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, projectId: e.target.value }))
                    }
                  >
                    <option value="">Select project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Developer</span>
                  <input
                    className="input control"
                    placeholder="Assignee"
                    value={newTask.assignee}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, assignee: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Hours</span>
                  <input
                    className="input control"
                    type="number"
                    min="0"
                    step="0.25"
                    placeholder="3.5"
                    value={newTask.hours}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, hours: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Priority</span>
                  <select
                    className="input control"
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, priority: e.target.value }))
                    }
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <label>
                  <span>Due date</span>
                  <input
                    className="input control"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                  />
                </label>
                <label className="projects-form__full">
                  <span>Reference image</span>
                  <input
                    key={taskAttachmentResetKey}
                    className="input control"
                    type="file"
                    accept="image/*"
                    onChange={handleTaskAttachmentChange}
                  />
                  <span className="muted small">
                    Optional: attach a screenshot or concept art for the developer.
                  </span>
                </label>
                <button className="btn btn-primary projects-form__cta" type="submit">
                  Add task
                </button>
              </form>
            </div>
          </div>

          <aside className="projects-sidebar">
            <div className="projects-sidebar-card">
              <div className="projects-sidebar-card__heading">
                <h3>Upcoming deadlines</h3>
              </div>
              {upcomingTasks.length === 0 ? (
                <p className="muted">No upcoming tasks with due dates.</p>
              ) : (
                <ul className="projects-timeline">
                  {upcomingTasks.map((task) => {
                    const projectName =
                      projects.find((project) => project.id === task.projectId)?.name ||
                      "Project";
                    return (
                      <li key={`upcoming-${task.id}`}>
                        <div>
                          <strong>{task.title}</strong>
                          <span className="muted small">
                            {projectName} · due {formatDateLabel(task.dueDate)}
                          </span>
                        </div>
                        <div className="projects-timeline__actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-small"
                            onClick={() => handleQuickStatusChange(task.id, "forward")}
                          >
                            Advance
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="projects-sidebar-card">
              <div className="projects-sidebar-card__heading">
                <h3>Overdue + blockers</h3>
              </div>
              {overdueTasks.length === 0 ? (
                <p className="muted">Great news—nothing overdue.</p>
              ) : (
                <ul className="projects-timeline">
                  {overdueTasks.slice(0, 5).map((task) => {
                    const projectName =
                      projects.find((project) => project.id === task.projectId)?.name ||
                      "Project";
                    return (
                      <li key={`overdue-${task.id}`}>
                        <div>
                          <strong>{task.title}</strong>
                          <span className="muted small">
                            {projectName} · was due {formatDateLabel(task.dueDate)}
                          </span>
                        </div>
                        <div className="projects-timeline__actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-small"
                            onClick={() => handleMarkComplete(task.id)}
                          >
                            Mark done
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-small"
                            onClick={() => handleCyclePriority(task.id)}
                          >
                            Priority: {task.priority || "normal"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="projects-sidebar-card">
              <div className="projects-sidebar-card__heading">
                <h3>Developer focus</h3>
                <select
                  className="input control"
                  value={focusedDeveloper}
                  onChange={(e) => setFocusedDeveloper(e.target.value)}
                >
                  <option value="">Select developer</option>
                  {developerSummary.map((developer) => (
                    <option key={developer.name} value={developer.name}>
                      {developer.name}
                    </option>
                  ))}
                </select>
              </div>
              {focusedDeveloper && focusedTasks.length > 0 ? (
                <ul className="projects-mini-list">
                  {focusedTasks.map((task) => (
                    <li key={`focus-${task.id}`}>
                      <div>
                        <strong>{task.title}</strong>
                        <span className="muted small">
                          {columns.find((column) => column.key === task.status)?.label ||
                            task.status}{" "}
                          · {task.hours} hrs
                        </span>
                      </div>
                      <div className="projects-timeline__actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-small"
                          onClick={() => handleQuickStatusChange(task.id, "forward")}
                        >
                          Move forward
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : focusedDeveloper ? (
                <p className="muted">No tasks assigned to {focusedDeveloper}.</p>
              ) : (
                <p className="muted">Choose a developer to review their workload.</p>
              )}
            </div>

            <div className="projects-sidebar-card">
              <div className="projects-sidebar-card__heading">
                <h3>Client updates</h3>
                {taskNotifications.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-small"
                    onClick={handleClearNotifications}
                  >
                    Clear log
                  </button>
                )}
              </div>
              {taskNotifications.length === 0 ? (
                <p className="muted">Send a task to review or done to draft an email.</p>
              ) : (
                <ul className="project-notifications">
                  {taskNotifications.slice(0, 5).map((notification) => (
                    <li className="project-notification" key={notification.id}>
                      <div className="project-notification__meta">
                        <span>{notification.projectName}</span>
                        <span>{new Date(notification.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="project-notification__stage">
                        {notification.stage === "review" ? "Review update" : "Completion email"}
                      </p>
                      <strong className="project-notification__subject">
                        {notification.subject}
                      </strong>
                      <p className="project-notification__body">{notification.body}</p>
                      <div className="project-notification__actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-small"
                          onClick={() => handleCopyNotification(notification)}
                        >
                          {copiedNotificationId === notification.id ? "Copied!" : "Copy email"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </section>

        <section className="projects-portfolio">
          <div className="projects-portfolio__header">
            <div>
              <h3>Active project portfolio</h3>
              <p className="muted small">
                Click a card to filter the task board. Use this view to keep budgets and scope aligned.
              </p>
            </div>
            <button
              className="btn btn-ghost btn-small"
              type="button"
              onClick={() => setSelectedProject("All")}
            >
              Show all projects
            </button>
          </div>
          <div className="projects-grid projects-grid--wrap">
            {projectsWithStats.length === 0 ? (
              <p className="muted">Add a project to get started.</p>
            ) : (
              projectsWithStats.map((project) => {
                const progress =
                  project.tasksTotal > 0
                    ? Math.round((project.tasksCompleted / project.tasksTotal) * 100)
                    : 0;
                const active = String(selectedProject) === String(project.id);
                return (
                  <div
                    className={`projects-card projects-card--project ${
                      active ? "is-active" : ""
                    }`}
                    key={project.id}
                  >
                    <div className="projects-card__header">
                      <div>
                        <p className="muted small">{project.client}</p>
                        <h3>{project.name}</h3>
                      </div>
                      <span className="projects-status">{project.status}</span>
                    </div>
                    <div className="projects-card__meta">
                      <div>
                        <p className="muted small">Budget</p>
                        <strong>{formatCurrency(project.budget)}</strong>
                      </div>
                      <div>
                        <p className="muted small">Tasks</p>
                        <strong>
                          {project.tasksCompleted}/{project.tasksTotal}
                        </strong>
                      </div>
                      <div>
                        <p className="muted small">Hours</p>
                        <strong>{project.hours.toFixed(1)}</strong>
                      </div>
                    </div>
                    <div className="projects-card__progress">
                      <div
                        className="projects-card__progress-fill"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="projects-card__actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-small"
                        onClick={() => handleSelectProjectCard(project.id)}
                      >
                        Focus board
                      </button>
                      <button
                        className="btn btn-ghost btn-small"
                        type="button"
                        onClick={() => handleRemoveProject(project.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="projects-board projects-board--fancy">
          <div className="projects-board__header">
            <div>
              <h3>Execution board</h3>
              <p className="muted small">
                Drag cards to update status. Filters help you zero in on the exact work you need to manage right now.
              </p>
            </div>
            <div className="projects-board__filters">
              <select
                className="input control"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="All">All projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <select
                className="input control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                {columns.map((column) => (
                  <option key={column.key} value={column.key}>
                    {column.label}
                  </option>
                ))}
              </select>
              <select
                className="input control"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All priorities</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
              <input
                className="input control"
                placeholder="Search tasks"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="projects-board__stats">
            <span>{boardSummary.visible} task{boardSummary.visible === 1 ? "" : "s"} shown</span>
            <span>{overdueTasks.length} overdue</span>
            <span>{boardSummary.developers} active developer{boardSummary.developers === 1 ? "" : "s"}</span>
          </div>
          <div className="projects-board__pulse">
            {columnStats.map((stat) => (
              <div key={`pulse-${stat.key}`}>
                <p className="muted small">{stat.label}</p>
                <strong>{stat.count}</strong>
                <span className="muted small">{stat.hours.toFixed(1)} hrs</span>
              </div>
            ))}
          </div>
          <div className="kanban-grid kanban-grid--wide">
            {tasksByColumn.map((column) => (
              <div
                key={column.key}
                className="kanban-column colorful"
                style={{ borderColor: column.color }}
                onDrop={() => handleDrop(column.key)}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="kanban-column__header">
                  <span>{column.label}</span>
                  <span>{column.tasks.length}</span>
                </div>
                <div className="kanban-column__body">
                  {column.tasks.length === 0 ? (
                    <p className="muted small">No tasks</p>
                  ) : (
                    column.tasks.map((task) => {
                      const projectName =
                        projects.find((project) => project.id === task.projectId)?.name ||
                        "Project";
                      return (
                        <div
                          key={task.id}
                          className="kanban-card kanban-card--neo"
                          draggable
                          onDragStart={() => handleDragStart(task.id)}
                        >
                          <div className="kanban-card__header">
                            <div>
                              <strong>{task.title}</strong>
                              <span className="muted small">{projectName}</span>
                            </div>
                            <span className="kanban-card__due">
                              {formatRelativeDueDate(task.dueDate)}
                            </span>
                          </div>
                          <div className="kanban-card__tags">
                            <button
                              type="button"
                              className="priority priority-toggle"
                              onClick={() => handleCyclePriority(task.id)}
                            >
                              {task.priority || "normal"}
                            </button>
                            {task.dueDate && (
                              <span className="priority priority--due">
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <div className="kanban-card__meta">
                            <span>{task.assignee || "Unassigned"}</span>
                            <span>{task.hours} hrs</span>
                          </div>
                          {task.attachment && (
                            <div className="kanban-card__asset">
                              {task.attachment.dataUrl && (
                                <img
                                  src={task.attachment.dataUrl}
                                  alt={`${task.title} reference`}
                                />
                              )}
                              <div>
                                <p className="muted small">{task.attachment.name}</p>
                                {task.attachment.dataUrl && (
                                  <a
                                    href={task.attachment.dataUrl}
                                    download={task.attachment.name}
                                    className="kanban-card__asset-link"
                                  >
                                    View asset
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="kanban-card__actions">
                            <button
                              type="button"
                              className="btn btn-ghost btn-small"
                              onClick={() => handleQuickStatusChange(task.id, "back")}
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-small"
                              onClick={() => handleQuickStatusChange(task.id, "forward")}
                            >
                              →
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-small"
                              onClick={() => handleRemoveTask(task.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
