import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Edit3,
  Trash2,
  AlertTriangle,
  Bell,
  Flag,
  CheckCircle2,
  Circle,
  Play,
  User,
  ChevronDown,
  FileText,
  Tag,
  Building
} from 'lucide-react';

export default function TaskItem({ task, onEdit, onDelete, currentUser }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(task);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Bạn có chắc chắn muốn xóa "${task.title}"?`)) {
      onDelete(task.id);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Định dạng ngày hiển thị với độ ưu tiên cao cho overdue
  const formatDate = (dateString) => {
    if (!dateString) return {
      text: 'Chưa đặt hạn',
      isOverdue: false,
      isToday: false,
      urgency: 0
    };

    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `Quá hạn ${Math.abs(diffDays)} ngày`,
        isOverdue: true,
        isToday: false,
        urgency: 10
      };
    } else if (diffDays === 0) {
      return {
        text: 'Hôm nay',
        isOverdue: false,
        isToday: true,
        urgency: 8
      };
    } else if (diffDays === 1) {
      return {
        text: 'Ngày mai',
        isOverdue: false,
        isToday: false,
        urgency: 6
      };
    } else if (diffDays <= 3) {
      return {
        text: `Còn ${diffDays} ngày`,
        isOverdue: false,
        isToday: false,
        urgency: 4
      };
    } else {
      return {
        text: date.toLocaleDateString('vi-VN', {
          month: 'short',
          day: 'numeric',
        }),
        isOverdue: false,
        isToday: false,
        urgency: 1
      };
    }
  };

  // Status mapping với glassmorphism colors
  const getStatusInfo = (status) => {
    const statusMap = {
      'todo': {
        text: 'Chờ làm',
        gradient: 'from-amber-200/20 to-amber-300/20',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-300/30',
        icon: Circle,
        glowColor: 'shadow-amber-500/20'
      },
      'in_progress': {
        text: 'Đang làm',
        gradient: 'from-blue-200/20 to-blue-300/20',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-300/30',
        icon: Play,
        glowColor: 'shadow-blue-500/20'
      },
      'review': {
        text: 'Duyệt',
        gradient: 'from-purple-200/20 to-purple-300/20',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-300/30',
        icon: Clock,
        glowColor: 'shadow-purple-500/20'
      },
      'completed': {
        text: 'Hoàn thành',
        gradient: 'from-emerald-200/20 to-emerald-300/20',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-300/30',
        icon: CheckCircle2,
        glowColor: 'shadow-emerald-500/20'
      },
      'cancelled': {
        text: 'Đã hủy',
        gradient: 'from-gray-200/20 to-gray-300/20',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-300/30',
        icon: Circle,
        glowColor: 'shadow-gray-500/20'
      }
    };
    return statusMap[status] || statusMap['todo'];
  };

  // Priority với visual weight cao
  const getPriorityInfo = (priority) => {
    const priorityMap = {
      'low': {
        text: 'Thấp',
        color: 'bg-gray-500/10 text-gray-600 border-gray-400/20',
        flagColor: 'text-gray-400',
        weight: 1
      },
      'medium': {
        text: 'TB',
        color: 'bg-orange-500/10 text-orange-600 border-orange-400/20',
        flagColor: 'text-orange-500',
        weight: 2
      },
      'high': {
        text: 'Cao',
        color: 'bg-red-500/10 text-red-600 border-red-400/20',
        flagColor: 'text-red-500',
        weight: 3
      },
      'urgent': {
        text: 'Gấp',
        color: 'bg-red-600/20 text-red-700 border-red-500/30',
        flagColor: 'text-red-600',
        weight: 4
      }
    };
    return priorityMap[priority] || priorityMap['medium'];
  };

  const canEditTask = () => {
    if (!currentUser || !task) return false;
    if (currentUser.role_level <= 2) return true;
    return task.created_by === currentUser.id || task.assigned_to === currentUser.id;
  };

  const statusInfo = getStatusInfo(task.status);
  const priorityInfo = getPriorityInfo(task.priority);
  const dateInfo = formatDate(task.due_date);
  const StatusIcon = statusInfo.icon;
  const canEdit = canEditTask();

  return (
    <div
      className={`
        group relative overflow-hidden cursor-pointer
        bg-white/70 backdrop-blur-xl 
        border border-white/50
        rounded-2xl shadow-lg 
        transition-all duration-200 ease-out will-change-transform
        ${statusInfo.glowColor}
        ${task.status === 'completed' ? 'opacity-60' : ''}
        ${dateInfo.isOverdue ? 'ring-2 ring-red-400/30' : ''}
        ${dateInfo.isToday ? 'ring-2 ring-blue-400/30' : ''}
        hover:shadow-xl hover:bg-white/80 hover:border-white/60
      `}
      onClick={toggleExpanded}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Gradient overlay for urgency */}
      {dateInfo.urgency >= 8 && (
        <div className={`
          absolute inset-0 pointer-events-none
          ${dateInfo.isOverdue
            ? 'bg-gradient-to-r from-red-500/5 to-red-600/5'
            : 'bg-gradient-to-r from-blue-500/5 to-blue-600/5'
          }
        `} />
      )}

      <div className="relative p-5">
        {/* Header - Compact View */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {/* Status Icon */}
            <div className={`
              p-2.5 rounded-xl bg-gradient-to-br ${statusInfo.gradient} backdrop-blur-sm 
              border ${statusInfo.borderColor}
            `}>
              <StatusIcon className={`w-4 h-4 ${statusInfo.textColor}`} />
            </div>

            {/* Title & Priority */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-1">
                <h4 className={`
                  text-base font-semibold truncate
                  ${task.status === 'completed'
                    ? 'line-through text-gray-500'
                    : 'text-gray-900'
                  }
                `}>
                  {task.title}
                </h4>

                {/* Priority Flag - Compact */}
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <Flag className={`w-3.5 h-3.5 ${priorityInfo.flagColor}`} />
                  <span className={`
                    px-2 py-0.5 rounded-md text-xs font-medium border
                    ${priorityInfo.color}
                  `}>
                    {priorityInfo.text}
                  </span>
                </div>
              </div>

              {/* Due Date - Prominent */}
              <div className="flex items-center space-x-2">
                <Calendar className={`
                  w-4 h-4
                  ${dateInfo.isOverdue
                    ? 'text-red-500'
                    : dateInfo.isToday
                      ? 'text-blue-500'
                      : 'text-gray-400'
                  }
                `} />
                <span className={`
                  text-sm font-medium
                  ${dateInfo.isOverdue
                    ? 'text-red-600'
                    : dateInfo.isToday
                      ? 'text-blue-600'
                      : 'text-gray-600'
                  }
                `}>
                  {dateInfo.text}
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Status & Actions */}
          <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
            {/* Status Badge */}
            <span className={`
              hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium
              bg-gradient-to-br ${statusInfo.gradient} backdrop-blur-sm
              border ${statusInfo.borderColor} ${statusInfo.textColor}
            `}>
              {statusInfo.text}
            </span>

            {/* Action Buttons - Always visible on urgent tasks or when expanded */}
            <div className={`
              flex items-center space-x-1
              ${canEdit && (dateInfo.urgency >= 6 || isExpanded)
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100'
              }
              transition-opacity duration-200
            `}>
              {canEdit && (
                <>
                  <button
                    onClick={handleEdit}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-500/10 rounded-lg transition-all duration-150"
                    title="Chỉnh sửa"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-all duration-150"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Expand/Collapse Icon */}
            <div
              className="text-gray-400 hover:text-gray-600 transition-all duration-200"
              style={{
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            >
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{
                duration: 0.25,
                ease: [0.4, 0.0, 0.2, 1],
                layout: { duration: 0.25 }
              }}
              className="space-y-4 overflow-hidden"
            >
              {/* Description */}
              {task.description && (
                <div className="p-4 bg-gray-50/50 backdrop-blur-sm rounded-xl border border-gray-200/50">
                  <div className="flex items-start space-x-2">
                    <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Mô tả</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {task.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Assigned User */}
                {task.assigned_to && task.assigned_to !== task.created_by && (
                  <div className="p-3 bg-blue-50/50 backdrop-blur-sm rounded-xl border border-blue-200/50">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="text-xs text-blue-600 font-medium">Người thực hiện</div>
                        <div className="text-sm text-blue-700">
                          {task.assignee_name || `User #${task.assigned_to}`}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Estimated Hours */}
                {task.estimated_hours && (
                  <div className="p-3 bg-purple-50/50 backdrop-blur-sm rounded-xl border border-purple-200/50">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <div>
                        <div className="text-xs text-purple-600 font-medium">Thời gian ước tính</div>
                        <div className="text-sm text-purple-700">{task.estimated_hours} giờ</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Category */}
                {task.category_name && (
                  <div className="p-3 bg-green-50/50 backdrop-blur-sm rounded-xl border border-green-200/50">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-green-500" />
                      <div>
                        <div className="text-xs text-green-600 font-medium">Danh mục</div>
                        <div className="text-sm text-green-700">{task.category_name}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Department */}
                {task.department_name && (
                  <div className="p-3 bg-orange-50/50 backdrop-blur-sm rounded-xl border border-orange-200/50">
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-orange-500" />
                      <div>
                        <div className="text-xs text-orange-600 font-medium">Phòng ban</div>
                        <div className="text-sm text-orange-700">{task.department_name}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200/50">
                {task.created_at && (
                  <span>
                    Tạo ngày {new Date(task.created_at).toLocaleString('vi-VN')}
                  </span>
                )}
                {task.updated_at && task.updated_at !== task.created_at && (
                  <span>
                    Cập nhật {new Date(task.updated_at).toLocaleString('vi-VN')}
                  </span>
                )}
                {task.completed_at && (
                  <span className="text-green-600 font-medium">
                    Hoàn thành {new Date(task.completed_at).toLocaleString('vi-VN')}
                  </span>
                )}
              </div>

              {/* Action buttons for expanded view */}
              {canEdit && (
                <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200/50">
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 rounded-xl backdrop-blur-sm border border-blue-300/30 transition-all duration-150 text-sm font-medium"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-xl backdrop-blur-sm border border-red-300/30 transition-all duration-150 text-sm font-medium"
                  >
                    Xóa
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Urgent Alert Overlay */}
      {dateInfo.isOverdue && task.status !== 'completed' && (
        <div className="absolute top-2 right-2">
          <div className="flex items-center justify-center w-6 h-6 bg-red-500 rounded-full shadow-lg animate-pulse">
            <AlertTriangle className="w-3 h-3 text-white" />
          </div>
        </div>
      )}

      {dateInfo.isToday && task.status !== 'completed' && !dateInfo.isOverdue && (
        <div className="absolute top-2 right-2">
          <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full shadow-lg animate-pulse">
            <Bell className="w-3 h-3 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}