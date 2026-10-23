"use client";

import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users, BookOpen, Plus, ChevronRight, GraduationCap, Trash2,
  Copy, Check, Video, ClipboardList, UserPlus, UserMinus,
  X, AlertCircle, RefreshCw, Hash, Loader2, Radio, Eye,
  ClipboardEdit
} from "lucide-react";

import { ClassInfo } from "@/lib/types";

interface EnrolledStudent {
  student_id: string;
  full_name: string;
  email: string;
  enrolled_at: string;
  status: string;
  last_activity?: string;
  is_online?: boolean;
}

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [activeClass, setActiveClass] = useState<ClassInfo | null>(null);

  // Roster state
  const [roster, setRoster] = useState<EnrolledStudent[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Create class form
  const [newClassName, setNewClassName] = useState("");
  const [newClassCode, setNewClassCode] = useState("");
  const [newClassDesc, setNewClassDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Assessment creation
  const [assessTitle, setAssessTitle] = useState("");
  const [assessDesc, setAssessDesc] = useState("");
  const [assessTime, setAssessTime] = useState(30);
  const [assessType, setAssessType] = useState("quiz");
  const [assessQuestions, setAssessQuestions] = useState([
    { title: "", prompt: "", options: [{ id: "A", text: "" }, { id: "B", text: "" }, { id: "C", text: "" }, { id: "D", text: "" }], correct_answer: "A", explanation: "", difficulty: "intermediate", points: 10 }
  ]);
  const [creatingAssess, setCreatingAssess] = useState(false);
  const [assessSuccess, setAssessSuccess] = useState(false);

  // Live class
  const [liveTitle, setLiveTitle] = useState("");
  const [liveDesc, setLiveDesc] = useState("");
  const [launchingLive, setLaunchingLive] = useState(false);
  const [liveSession, setLiveSession] = useState<any>(null);

  const loadClasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getClasses();
      setClasses(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load classes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const loadRoster = async (classId: string) => {
    setRosterLoading(true);
    setAddError(null);
    try {
      const data = await (api as any).getEnrolledStudents(classId);
      setRoster(Array.isArray(data) ? data : []);
    } catch {
      setRoster([]);
    } finally {
      setRosterLoading(false);
    }
  };

  const openRoster = (cls: ClassInfo) => {
    setActiveClass(cls);
    setRoster([]);
    setAddEmail("");
    setAddError(null);
    setShowRosterModal(true);
    loadRoster(cls.id);
  };

  const addStudent = async () => {
    if (!activeClass || !addEmail.trim()) return;
    setAddingStudent(true);
    setAddError(null);
    try {
      const student = await (api as any).addStudentToClass(activeClass.id, addEmail.trim());
      setRoster(prev => {
        const exists = prev.find(s => s.student_id === student.student_id);
        return exists ? prev : [student, ...prev];
      });
      setAddEmail("");
      // Refresh classes count
      loadClasses();
    } catch (e: any) {
      setAddError(e?.message || "Could not add student. Check the email address.");
    } finally {
      setAddingStudent(false);
    }
  };

  const removeStudent = async (studentId: string) => {
    if (!activeClass) return;
    try {
      await (api as any).removeStudentFromClass(activeClass.id, studentId);
      setRoster(prev => prev.filter(s => s.student_id !== studentId));
      loadClasses();
    } catch (e: any) {
      setAddError(e?.message || "Failed to remove student");
    }
  };

  const createClass = async () => {
    if (!newClassName || !newClassCode) return;
    setCreating(true);
    try {
      const created = await api.createClass({ name: newClassName, code: newClassCode, description: newClassDesc });
      setClasses(prev => [created, ...prev]);
      setShowCreateModal(false);
      setNewClassName(""); setNewClassCode(""); setNewClassDesc("");
    } catch (e: any) {
      alert(e?.message || "Failed to create class");
    } finally {
      setCreating(false);
    }
  };

  const addQuestionField = () => {
    setAssessQuestions(prev => [...prev, {
      title: "", prompt: "",
      options: [{ id: "A", text: "" }, { id: "B", text: "" }, { id: "C", text: "" }, { id: "D", text: "" }],
      correct_answer: "A", explanation: "", difficulty: "intermediate", points: 10
    }]);
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    setAssessQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateOption = (qIdx: number, optIdx: number, text: string) => {
    setAssessQuestions(prev => prev.map((q, i) =>
      i === qIdx ? { ...q, options: q.options.map((o, oi) => oi === optIdx ? { ...o, text } : o) } : q
    ));
  };

  const createAssessment = async () => {
    if (!activeClass) return;
    setCreatingAssess(true);
    try {
      await (api as any).createCustomAssessment({
        title: assessTitle,
        description: assessDesc,
        class_id: activeClass.id,
        assessment_type: assessType,
        time_limit_minutes: assessTime,
        passing_score: 60,
        questions: assessQuestions.map(q => ({
          title: q.title || q.prompt.slice(0, 40),
          prompt: q.prompt,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          points: q.points
        }))
      });
      setAssessSuccess(true);
      setTimeout(() => {
        setAssessSuccess(false);
        setShowAssessmentModal(false);
        setAssessTitle(""); setAssessDesc(""); setAssessQuestions([{
          title: "", prompt: "",
          options: [{ id: "A", text: "" }, { id: "B", text: "" }, { id: "C", text: "" }, { id: "D", text: "" }],
          correct_answer: "A", explanation: "", difficulty: "intermediate", points: 10
        }]);
      }, 2000);
    } catch (e: any) {
      alert(e?.message || "Failed to create assessment");
    } finally {
      setCreatingAssess(false);
    }
  };

  const startLiveClass = async () => {
    if (!activeClass || !liveTitle) return;
    setLaunchingLive(true);
    try {
      const session = await (api as any).startLiveClass({
        class_id: activeClass.id,
        title: liveTitle,
        description: liveDesc
      });
      setLiveSession(session);
    } catch (e: any) {
      alert(e?.message || "Failed to start live class");
    } finally {
      setLaunchingLive(false);
    }
  };

  const deleteClass = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class? This cannot be undone.")) return;
    try {
      await (api as any).deleteClass(classId);
      setClasses(prev => prev.filter(c => c.id !== classId));
    } catch (e: any) {
      alert(e?.message || "Failed to delete class");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600" /> Classes & Rosters
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create classes, manage students, assign assessments, and launch live teaching sessions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadClasses} variant="outline" size="sm" className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1.5">
            <Plus className="w-4 h-4" /> Create New Class
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : classes.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <CardContent>
            <GraduationCap className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-800">No classes yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2">
              Create your first class to get started. Students will join using the class code.
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm">
              <Plus className="w-4 h-4 mr-1.5" /> Create First Class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((c) => (
            <Card key={c.id} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="mastered" className="text-[10px] uppercase font-bold">Active</Badge>
                  <div className="flex items-center gap-1.5">
                    {/* Class join code */}
                    <div
                      className="flex items-center gap-1 px-2 py-1 bg-indigo-50 border border-indigo-200 rounded-lg cursor-pointer hover:bg-indigo-100 transition"
                      onClick={() => c.code && copyCode(c.code)}
                      title="Click to copy join code"
                    >
                      <Hash className="w-3 h-3 text-indigo-600" />
                      <span className="text-xs font-mono font-bold text-indigo-700">{c.code}</span>
                      {copiedCode === c.code ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-indigo-500" />
                      )}
                    </div>
                    <button
                      onClick={() => deleteClass(c.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                      title="Delete class"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <CardTitle className="text-base font-bold text-slate-900">{c.name}</CardTitle>
                <CardDescription className="text-xs">{c.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xl font-bold text-slate-900">{c.student_count ?? 0}</p>
                    <p className="text-slate-500">Students</p>
                  </div>
                  <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-xl font-bold text-indigo-700">{c.code}</p>
                    <p className="text-indigo-500">Join Code</p>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                    <p className="text-xl font-bold text-emerald-700">Active</p>
                    <p className="text-emerald-500">Status</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => openRoster(c)}
                    variant="outline" size="sm"
                    className="text-xs gap-1.5 hover:border-indigo-300"
                  >
                    <Users className="w-3.5 h-3.5" /> Manage Roster
                  </Button>
                  <Button
                    onClick={() => { setActiveClass(c); setShowAssessmentModal(true); setAssessSuccess(false); }}
                    variant="outline" size="sm"
                    className="text-xs gap-1.5 hover:border-violet-300"
                  >
                    <ClipboardEdit className="w-3.5 h-3.5" /> Assign Quiz
                  </Button>
                  <Button
                    onClick={() => { setActiveClass(c); setShowLiveModal(true); setLiveSession(null); }}
                    size="sm"
                    className="text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white col-span-2"
                  >
                    <Radio className="w-3.5 h-3.5 animate-pulse" /> Start Live Teaching
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ===== CREATE CLASS MODAL ===== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Create New Class</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Class Name *</label>
                <input
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  placeholder="e.g. CS 101: Data Structures"
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Join Code * <span className="text-indigo-500">(Students use this to join)</span></label>
                <input
                  value={newClassCode}
                  onChange={e => setNewClassCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
                  placeholder="e.g. CS101A"
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Description</label>
                <textarea
                  value={newClassDesc}
                  onChange={e => setNewClassDesc(e.target.value)}
                  rows={2}
                  placeholder="Brief course description..."
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={() => setShowCreateModal(false)} variant="outline" className="flex-1 text-sm">Cancel</Button>
                <Button onClick={createClass} disabled={creating || !newClassName || !newClassCode} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
                  {creating ? "Creating..." : "Create Class"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ROSTER MODAL ===== */}
      {showRosterModal && activeClass && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Student Roster</h2>
                <p className="text-xs text-slate-500">{activeClass.name}</p>
              </div>
              <button onClick={() => setShowRosterModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add student */}
            <div className="p-4 border-b border-slate-100 shrink-0">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Add Student by Email</label>
              <div className="flex gap-2 mt-1.5">
                <input
                  value={addEmail}
                  onChange={e => setAddEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addStudent()}
                  placeholder="student@example.com"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button onClick={addStudent} disabled={addingStudent || !addEmail.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3">
                  {addingStudent ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                </Button>
              </div>
              {addError && (
                <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {addError}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1.5">
                Share join code <span className="font-mono font-bold text-indigo-600">{activeClass.code}</span> with students so they can self-enroll.
              </p>
            </div>

            {/* Student list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {rosterLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                </div>
              ) : roster.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No students enrolled yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Add by email or share the join code.</p>
                </div>
              ) : roster.map(stu => (
                <div key={stu.student_id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                      {stu.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{stu.full_name}</p>
                      <p className="text-xs text-slate-400">{stu.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${stu.is_online ? "bg-emerald-400" : "bg-slate-300"}`} />
                    <button
                      onClick={() => removeStudent(stu.student_id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                      title="Remove student"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 shrink-0">
              <p className="text-xs text-center text-slate-400">{roster.length} student{roster.length !== 1 ? "s" : ""} enrolled</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== ASSIGN ASSESSMENT MODAL ===== */}
      {showAssessmentModal && activeClass && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create & Assign Assessment</h2>
                <p className="text-xs text-slate-500">{activeClass.name}</p>
              </div>
              <button onClick={() => setShowAssessmentModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {assessSuccess ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <Check className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-bounce" />
                  <h3 className="text-lg font-bold text-slate-900">Assessment Created!</h3>
                  <p className="text-sm text-slate-500 mt-2">Students can now see it in their Assessments page.</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Basic info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Title *</label>
                    <input value={assessTitle} onChange={e => setAssessTitle(e.target.value)} placeholder="e.g. Week 3 Quiz: Sorting Algorithms" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Type</label>
                    <select value={assessType} onChange={e => setAssessType(e.target.value)} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="quiz">Quiz</option>
                      <option value="diagnostic">Diagnostic</option>
                      <option value="reassessment">Reassessment</option>
                      <option value="initial">Initial Diagnostic</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Time Limit (min)</label>
                    <input type="number" value={assessTime} onChange={e => setAssessTime(Number(e.target.value))} min={5} max={180} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Description</label>
                    <input value={assessDesc} onChange={e => setAssessDesc(e.target.value)} placeholder="Brief description (optional)" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                {/* Questions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Questions</label>
                    <Button onClick={addQuestionField} variant="outline" size="sm" className="text-xs gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Add Question
                    </Button>
                  </div>
                  <div className="space-y-5">
                    {assessQuestions.map((q, qIdx) => (
                      <div key={qIdx} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Q{qIdx + 1}</span>
                          {assessQuestions.length > 1 && (
                            <button onClick={() => setAssessQuestions(prev => prev.filter((_, i) => i !== qIdx))} className="text-slate-400 hover:text-red-500 transition">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <textarea value={q.prompt} onChange={e => updateQuestion(qIdx, "prompt", e.target.value)} placeholder="Question text..." rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${q.correct_answer === opt.id ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"}`}>{opt.id}</span>
                              <input value={opt.text} onChange={e => updateOption(qIdx, oIdx, e.target.value)} placeholder={`Option ${opt.id}`} className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Correct</label>
                            <select value={q.correct_answer} onChange={e => updateQuestion(qIdx, "correct_answer", e.target.value)} className="ml-2 px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none">
                              {q.options.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Points</label>
                            <input type="number" value={q.points} onChange={e => updateQuestion(qIdx, "points", Number(e.target.value))} className="ml-2 w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none" min={1} />
                          </div>
                        </div>
                        <input value={q.explanation} onChange={e => updateQuestion(qIdx, "explanation", e.target.value)} placeholder="Explanation (optional — shown after submit)" className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!assessSuccess && (
              <div className="p-5 border-t border-slate-100 flex gap-3 shrink-0">
                <Button onClick={() => setShowAssessmentModal(false)} variant="outline" className="flex-1 text-sm">Cancel</Button>
                <Button
                  onClick={createAssessment}
                  disabled={creatingAssess || !assessTitle || assessQuestions.some(q => !q.prompt)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                >
                  {creatingAssess ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <ClipboardList className="w-4 h-4 mr-1.5" />}
                  {creatingAssess ? "Publishing..." : "Publish Assessment"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== LIVE CLASS MODAL ===== */}
      {showLiveModal && activeClass && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Start Live Teaching Session</h2>
                <p className="text-xs text-slate-500">{activeClass.name}</p>
              </div>
              <button onClick={() => setShowLiveModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {liveSession ? (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-red-700 font-bold">
                      <Radio className="w-5 h-5 animate-pulse" /> LIVE SESSION ACTIVE
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{liveSession.title}</p>
                    <p className="text-xs text-slate-500">Session ID: {liveSession.id}</p>
                    <p className="text-xs text-slate-500">{liveSession.active_attendees_count || 1} attendee(s) connected</p>
                  </div>
                  <a
                    href={`/teacher/live-class/${liveSession.id}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition"
                  >
                    <Video className="w-4 h-4" /> Open Teaching Studio
                  </a>
                  <Button onClick={() => setShowLiveModal(false)} variant="outline" className="w-full text-sm">Close</Button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Session Title *</label>
                    <input value={liveTitle} onChange={e => setLiveTitle(e.target.value)} placeholder="e.g. Tree Traversal Deep-Dive" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Topic Description</label>
                    <textarea value={liveDesc} onChange={e => setLiveDesc(e.target.value)} rows={2} placeholder="What will you cover today?" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                    <strong>📡 Students will see</strong> this session appear live in their Classes → Live Sessions panel. They can join and follow your slides in real time.
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => setShowLiveModal(false)} variant="outline" className="flex-1 text-sm">Cancel</Button>
                    <Button onClick={startLiveClass} disabled={launchingLive || !liveTitle} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm gap-1.5">
                      {launchingLive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4 animate-pulse" />}
                      {launchingLive ? "Starting..." : "Go Live"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
