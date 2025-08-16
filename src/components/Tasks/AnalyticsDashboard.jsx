import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar,
  PieChart,
  Target,
  Award,
  Zap,
  Activity,
  Layers,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

// ===== HELPER FUNCTIONS =====
const getStatusLabel = (status) => {
  const statusMap = {
    'todo': 'Chờ làm',
    'in_progress': 'Đang làm',
    'review': 'Đang duyệt',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy'
  };
  return statusMap[status] || status;
};

const getPriorityLabel = (priority) => {
  const priorityMap = {
    'low': 'Thấp',
    'medium': 'Trung bình',
    'high': 'Cao',
    'urgent': 'Khẩn cấp'
  };
  return priorityMap[priority] || priority;
};

// ===== GLASS CONTAINER COMPONENT =====
const GlassContainer = ({ children, className = "", blur = "md", opacity = "10" }) => {
  return (
    <div className={`
      backdrop-blur-${blur} 
      bg-white/${opacity} 
      border border-slate-200/40 
      rounded-3xl 
      shadow-[0_20px_60px_rgba(148,163,184,0.08)]
      ${className}
    `}>
      {children}
    </div>
  );
};

// ===== METRIC CARD COMPONENT =====
const MetricCard = ({ icon: Icon, title, value, subtitle, trend = null, iconBg = "bg-gradient-to-br from-slate-100 to-slate-200" }) => {
  return (
    <GlassContainer className="p-8 hover:bg-white/15 transition-all duration-500 group hover:shadow-[0_24px_80px_rgba(148,163,184,0.12)]">
      <div className="flex items-center justify-between mb-6">
        <div className={`h-16 w-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center shadow-[0_8px_32px_rgba(148,163,184,0.15)]`}>
          <Icon className="h-8 w-8 text-slate-600" />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-sm font-medium ${trend.type === 'up' ? 'text-emerald-500' :
            trend.type === 'down' ? 'text-red-500' : 'text-slate-500'
            }`}>
            {trend.type === 'up' && <ArrowUp className="w-4 h-4" />}
            {trend.type === 'down' && <ArrowDown className="w-4 h-4" />}
            {trend.type === 'stable' && <Minus className="w-4 h-4" />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">{title}</h3>
        <p className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          {value}
        </p>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </GlassContainer>
  );
};

// ===== DONUT CHART COMPONENT =====
const DonutChart = ({ data, title, centerValue, centerLabel }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <GlassContainer className="p-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6 shadow-[inset_0_2px_8px_rgba(148,163,184,0.1)]">
            <PieChart className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-500 font-medium">Chưa có dữ liệu</p>
          <p className="text-sm text-slate-400 text-center mt-2">Hãy hoàn thành vài công việc để xem phân tích</p>
        </div>
      </GlassContainer>
    );
  }

  let cumulativePercentage = 0;
  const segments = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const segmentData = {
      ...item,
      percentage,
      offset: cumulativePercentage
    };
    cumulativePercentage += percentage;
    return segmentData;
  });

  return (
    <GlassContainer className="p-8">
      <h3 className="text-xl font-semibold text-slate-800 mb-8 flex items-center">
        <PieChart className="w-6 h-6 mr-3 text-slate-500" />
        {title}
      </h3>

      <div className="flex flex-col lg:flex-row items-center space-y-8 lg:space-y-0 lg:space-x-12">
        {/* Donut Chart */}
        <div className="relative">
          <svg width="240" height="240" className="transform -rotate-90">
            <circle
              cx="120"
              cy="120"
              r="90"
              stroke="rgb(226 232 240 / 0.4)"
              strokeWidth="24"
              fill="none"
            />
            {segments.map((segment, index) => {
              const circumference = 2 * Math.PI * 90;
              const strokeDasharray = `${(segment.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((segment.offset / 100) * circumference);

              return (
                <circle
                  key={index}
                  cx="120"
                  cy="120"
                  r="90"
                  stroke={segment.color}
                  strokeWidth="24"
                  fill="none"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                  style={{
                    filter: 'drop-shadow(0 4px 6px rgb(148 163 184 / 0.1))'
                  }}
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              {centerValue || total}
            </div>
            <div className="text-sm text-slate-600 font-medium mt-1">
              {centerLabel || 'Tổng công việc'}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-4 flex-1 w-full">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-white/30 backdrop-blur-sm rounded-2xl border border-slate-200/30 hover:bg-white/40 transition-colors shadow-[0_4px_16px_rgba(148,163,184,0.06)]">
              <div className="flex items-center space-x-4">
                <div
                  className="w-5 h-5 rounded-full shadow-md"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="font-semibold text-slate-700">{segment.label}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-800 text-lg">{segment.value}</div>
                <div className="text-sm text-slate-500">{Math.round(segment.percentage)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassContainer>
  );
};

// ===== WAVE PROGRESS CHART =====
const WaveProgressChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(item => item.value), 1);

  return (
    <GlassContainer className="p-8">
      <h3 className="text-xl font-semibold text-slate-800 mb-8 flex items-center">
        <Activity className="w-6 h-6 mr-3 text-slate-500" />
        {title}
      </h3>

      <div className="space-y-6">
        {data.map((item, index) => (
          <div key={index} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">{item.label}</span>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-slate-800">{item.value}</span>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: item.color }} />
              </div>
            </div>

            <div className="relative h-4 bg-slate-100/60 rounded-full overflow-hidden backdrop-blur-sm shadow-[inset_0_2px_4px_rgba(148,163,184,0.1)]">
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  background: `linear-gradient(90deg, ${item.color}22 0%, ${item.color} 100%)`,
                  boxShadow: `0 0 20px ${item.color}40`
                }}
              />
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out animate-pulse"
                style={{
                  width: `${Math.min((item.value / maxValue) * 100 + 5, 100)}%`,
                  background: `linear-gradient(90deg, transparent 0%, ${item.color}30 70%, ${item.color}60 100%)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </GlassContainer>
  );
};

// ===== RADAR CHART (Biểu đồ radar đơn giản) =====
const SimpleRadarChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(item => item.value), 1);
  const centerX = 150;
  const centerY = 150;
  const radius = 100;
  const angleStep = (2 * Math.PI) / data.length;

  const points = data.map((item, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const distance = (item.value / maxValue) * radius;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    return { x, y, angle, item };
  });

  const pathData = points.map((point, index) =>
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z';

  return (
    <GlassContainer className="p-8">
      <h3 className="text-xl font-semibold text-slate-800 mb-8 flex items-center">
        <Target className="w-6 h-6 mr-3 text-slate-500" />
        {title}
      </h3>

      <div className="flex justify-center">
        <svg width="300" height="300" className="overflow-visible">
          {/* Grid lines */}
          {[0.2, 0.4, 0.6, 0.8, 1].map((scale, index) => (
            <circle
              key={index}
              cx={centerX}
              cy={centerY}
              r={radius * scale}
              fill="none"
              stroke="rgb(148 163 184 / 0.2)"
              strokeWidth="1"
            />
          ))}

          {/* Axis lines */}
          {data.map((_, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const x2 = centerX + Math.cos(angle) * radius;
            const y2 = centerY + Math.sin(angle) * radius;
            return (
              <line
                key={index}
                x1={centerX}
                y1={centerY}
                x2={x2}
                y2={y2}
                stroke="rgb(148 163 184 / 0.2)"
                strokeWidth="1"
              />
            );
          })}

          {/* Data area */}
          <path
            d={pathData}
            fill="rgb(148 163 184 / 0.15)"
            stroke="rgb(100 116 139)"
            strokeWidth="3"
            className="drop-shadow-lg"
          />

          {/* Data points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="6"
              fill="rgb(100 116 139)"
              stroke="white"
              strokeWidth="2"
              className="drop-shadow-md"
            />
          ))}

          {/* Labels */}
          {data.map((item, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const labelDistance = radius + 30;
            const x = centerX + Math.cos(angle) * labelDistance;
            const y = centerY + Math.sin(angle) * labelDistance;
            return (
              <text
                key={index}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-sm font-medium fill-slate-700"
              >
                {item.label}
              </text>
            );
          })}
        </svg>
      </div>
    </GlassContainer>
  );
};

// ===== TIMELINE CHART =====
const TimelineChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(item => item.value), 1);

  return (
    <GlassContainer className="p-8">
      <h3 className="text-xl font-semibold text-slate-800 mb-8 flex items-center">
        <TrendingUp className="w-6 h-6 mr-3 text-slate-500" />
        {title}
      </h3>

      <div className="relative">
        <svg width="100%" height="200" className="overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <line
              key={index}
              x1="50"
              y1={160 - (ratio * 120)}
              x2="100%"
              y2={160 - (ratio * 120)}
              stroke="rgb(148 163 184 / 0.2)"
              strokeWidth="1"
              strokeDasharray={index === 0 ? "none" : "4,4"}
            />
          ))}

          {/* Data line */}
          <polyline
            fill="none"
            stroke="url(#timeline-gradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={data.map((item, index) =>
              `${50 + (index * (100 / (data.length - 1)))} ${160 - ((item.value / maxValue) * 120)}`
            ).join(' ')}
            className="drop-shadow-sm"
          />

          {/* Data points */}
          {data.map((item, index) => (
            <circle
              key={index}
              cx={50 + (index * (100 / (data.length - 1)))}
              cy={160 - ((item.value / maxValue) * 120)}
              r="6"
              fill="white"
              stroke="rgb(100 116 139)"
              strokeWidth="3"
              className="drop-shadow-md hover:r-8 transition-all cursor-pointer"
            />
          ))}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="timeline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: 'rgb(148 163 184)', stopOpacity: 0.8 }} />
              <stop offset="50%" style={{ stopColor: 'rgb(100 116 139)', stopOpacity: 0.9 }} />
              <stop offset="100%" style={{ stopColor: 'rgb(71 85 105)', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between px-12 mt-4">
          {data.map((item, index) => (
            <div key={index} className="text-center">
              <div className="text-sm font-medium text-slate-600">{item.label}</div>
              <div className="text-xs text-slate-500 mt-1">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </GlassContainer>
  );
};

// ===== ALERT CARD =====
const AlertCard = ({ overdueTasks }) => {
  if (overdueTasks.length === 0) return null;

  return (
    <GlassContainer className="p-8 border-red-200/50 bg-red-50/20">
      <div className="flex items-start space-x-6">
        <div className="h-16 w-16 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-[0_8px_32px_rgba(239,68,68,0.15)]">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-red-800 mb-3">
            {overdueTasks.length} công việc trễ hạn
          </h3>
          <div className="space-y-3 mb-6">
            {overdueTasks.slice(0, 3).map(task => (
              <div key={task.id} className="flex items-center justify-between bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30 shadow-[0_4px_16px_rgba(148,163,184,0.06)]">
                <span className="font-semibold text-slate-800">{task.title}</span>
                <span className="text-sm text-red-600 font-medium">
                  Hạn: {new Date(task.due_date).toLocaleDateString('vi-VN')}
                </span>
              </div>
            ))}
            {overdueTasks.length > 3 && (
              <p className="text-sm text-red-700 italic font-medium">
                ... và {overdueTasks.length - 3} công việc trễ hạn khác
              </p>
            )}
          </div>
        </div>
      </div>
    </GlassContainer>
  );
};

// ===== EXPORT SECTION =====
const ExportSection = ({ onExport, isExporting, hasData }) => {
  const exportOptions = [
    { format: 'csv', label: 'CSV', icon: BarChart3, color: 'from-slate-400 to-slate-500' },
    { format: 'json', label: 'JSON', icon: Download, color: 'from-slate-500 to-slate-600' },
    { format: 'pdf', label: 'PDF', icon: Download, color: 'from-slate-600 to-slate-700' }
  ];

  return (
    <GlassContainer className="p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="mb-8 lg:mb-0">
          <h3 className="text-2xl font-semibold text-slate-800 mb-3 flex items-center">
            <Download className="w-6 h-6 mr-3 text-slate-500" />
            Xuất dữ liệu
          </h3>
          <p className="text-slate-600 text-lg">Xuất dữ liệu công việc và báo cáo phân tích theo nhiều định dạng</p>
        </div>

        <div className="flex flex-wrap gap-4">
          {exportOptions.map(option => (
            <button
              key={option.format}
              onClick={() => onExport(option.format)}
              disabled={isExporting || !hasData}
              className={`
                group relative inline-flex items-center px-8 py-4 bg-gradient-to-r ${option.color} 
                text-white rounded-2xl shadow-[0_12px_32px_rgba(148,163,184,0.3)] hover:shadow-[0_16px_40px_rgba(148,163,184,0.4)]
                transition-all duration-500 font-semibold text-sm
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:scale-105 transform hover:-translate-y-1
                before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-white/0 before:to-white/20 
                before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
                focus:outline-none focus:ring-4 focus:ring-slate-300/50
                overflow-hidden
              `}
            >
              <div className="relative z-10 flex items-center">
                <option.icon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                <span className="group-hover:tracking-wider transition-all duration-300">{option.label}</span>
              </div>

              {/* Shine effect */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            </button>
          ))}
        </div>
      </div>

      {isExporting && (
        <div className="mt-8 flex items-center justify-center space-x-4 p-6 bg-white backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-[0_8px_32px_rgba(148,163,184,0.08)]">
          <div className="animate-spin rounded-full h-6 w-6 border-3 border-slate-500 border-t-transparent"></div>
          <span className="text-slate-700 font-semibold text-lg">Đang xuất dữ liệu...</span>
        </div>
      )}

      {!hasData && (
        <div className="mt-8 p-6 bg-slate-50/50 backdrop-blur-sm border border-slate-200/50 rounded-2xl text-center shadow-[inset_0_2px_8px_rgba(148,163,184,0.06)]">
          <p className="text-slate-500 text-lg">Không có dữ liệu cho khoảng thời gian đã chọn.</p>
        </div>
      )}
    </GlassContainer>
  );
};

// ===== PRODUCTIVITY INSIGHTS =====
const ProductivityInsights = ({ analyticsData }) => {
  const insights = [
    {
      icon: Award,
      title: "Hiệu suất",
      content: analyticsData.completionRate >= 80
        ? 'Tuyệt vời! Bạn đang duy trì tỷ lệ hoàn thành cao. Tiếp tục phát huy nhé!'
        : analyticsData.completionRate >= 60
          ? 'Tiến triển tốt! Cố gắng đẩy tỷ lệ hoàn thành lên trên 80% để tối ưu năng suất.'
          : 'Còn nhiều dư địa cải thiện. Hãy ưu tiên hoàn thành các công việc đang có trước khi nhận thêm việc mới.',
      color: 'from-slate-200 to-slate-300'
    },
    {
      icon: Clock,
      title: "Quản lý thời gian",
      content: analyticsData.overdueTasks.length === 0
        ? 'Hoàn hảo! Bạn không có công việc trễ hạn. Quản lý thời gian rất tốt.'
        : `Bạn có ${analyticsData.overdueTasks.length} công việc trễ hạn. Hãy ưu tiên xử lý để giữ đúng tiến độ.`,
      color: 'from-slate-300 to-slate-400'
    }
  ];

  return (
    <GlassContainer className="p-8 bg-gradient-to-br from-slate-50/30 to-white/30">
      <h3 className="text-2xl font-semibold text-slate-800 mb-8 flex items-center">
        <TrendingUp className="w-6 h-6 mr-3 text-slate-500" />
        Gợi ý cải thiện năng suất
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {insights.map((insight, index) => (
          <div key={index} className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/30 hover:bg-white/50 transition-all duration-300 shadow-[0_8px_32px_rgba(148,163,184,0.08)]">
            <div className="flex items-center space-x-4 mb-4">
              <div className={`h-12 w-12 bg-gradient-to-br ${insight.color} rounded-xl flex items-center justify-center shadow-[0_4px_16px_rgba(148,163,184,0.15)]`}>
                <insight.icon className="h-6 w-6 text-slate-600" />
              </div>
              <h4 className="font-bold text-slate-800 text-lg">{insight.title}</h4>
            </div>
            <p className="text-slate-600 leading-relaxed">{insight.content}</p>
          </div>
        ))}
      </div>
    </GlassContainer>
  );
};

// ===== MAIN COMPONENT =====
export default function ElegantAnalyticsDashboard({ tasks = [], user }) {
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [filteredTasks, setFilteredTasks] = useState(tasks);
  const [isExporting, setIsExporting] = useState(false);

  // Filter tasks by period
  useEffect(() => {
    if (selectedPeriod === 'all') {
      setFilteredTasks(tasks);
    } else {
      const now = new Date();
      const filterDate = new Date();

      if (selectedPeriod === 'week') {
        filterDate.setDate(now.getDate() - 7);
      } else if (selectedPeriod === 'month') {
        filterDate.setMonth(now.getMonth() - 1);
      }

      const filtered = tasks.filter(task => {
        const taskDate = new Date(task.created_at || task.due_date);
        return taskDate >= filterDate;
      });

      setFilteredTasks(filtered);
    }
  }, [selectedPeriod, tasks]);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const statusData = [
      {
        label: 'Chờ làm',
        value: filteredTasks.filter(task => task.status === 'todo').length,
        color: '#F59E0B'
      },
      {
        label: 'Đang làm',
        value: filteredTasks.filter(task => task.status === 'in_progress').length,
      },
      {
        label: 'Đang duyệt',
        value: filteredTasks.filter(task => task.status === 'review').length,
        color: '#8B5CF6'
      },
      {
        label: 'Hoàn thành',
        value: filteredTasks.filter(task => task.status === 'completed').length,
        color: '#10B981'
      },
      {
        label: 'Đã hủy',
        value: filteredTasks.filter(task => task.status === 'cancelled').length,
        color: '#6B7280'
      }
    ];

    const priorityData = [
      {
        label: 'Thấp',
        value: filteredTasks.filter(task => task.priority === 'low').length,
        color: '#94A3B8'
      },
      {
        label: 'Trung bình',
        value: filteredTasks.filter(task => task.priority === 'medium').length,
        color: '#F59E0B'
      },
      {
        label: 'Cao',
        value: filteredTasks.filter(task => task.priority === 'high').length,
        color: '#EF4444'
      },
      {
        label: 'Khẩn cấp',
        value: filteredTasks.filter(task => task.priority === 'urgent').length,
        color: '#DC2626'
      }
    ];

    // Daily completion data (last 7 days)
    const completionData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });

      const completedToday = filteredTasks.filter(task => {
        const completedDate = new Date(task.updated_at || task.created_at);
        return task.status === 'completed' &&
          completedDate.toDateString() === date.toDateString();
      }).length;

      completionData.push({
        label: i === 0 ? 'Hôm nay' : dateStr,
        value: completedToday,
        color: '#64748B'
      });
    }

    // Performance radar data
    const performanceData = [
      { label: 'Hiệu suất', value: Math.min(filteredTasks.filter(t => t.status === 'completed').length, 10) },
      { label: 'Tốc độ', value: Math.min(completionData.reduce((sum, item) => sum + item.value, 0), 10) },
      { label: 'Chất lượng', value: Math.min(filteredTasks.filter(t => t.priority === 'high' && t.status === 'completed').length * 2, 10) },
      {
        label: 'Đúng hạn', value: Math.min(10 - filteredTasks.filter(t => {
          if (!t.due_date || t.status === 'completed') return false;
          return new Date(t.due_date) < new Date();
        }).length, 10)
      },
      { label: 'Tập trung', value: Math.min(filteredTasks.filter(t => t.status === 'in_progress').length * 3, 10) }
    ];

    // Overdue tasks
    const overdueTasks = filteredTasks.filter(task => {
      if (task.status === 'completed') return false;
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate < today;
    });

    return {
      statusData,
      priorityData,
      completionData,
      performanceData,
      overdueTasks,
      totalTasks: filteredTasks.length,
      completionRate: filteredTasks.length > 0
        ? Math.round((filteredTasks.filter(t => t.status === 'completed').length / filteredTasks.length) * 100)
        : 0,
      inProgressTasks: filteredTasks.filter(t => t.status === 'in_progress').length
    };
  }, [filteredTasks]);

  // Export handlers (simplified for demo)
  const handleExport = async (format) => {
    setIsExporting(true);

    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`Exporting ${format} format with ${filteredTasks.length} tasks`);

    setIsExporting(false);
  };

  return (
    <div
      className="min-h-screen p-8 space-y-8"
      style={{
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 25%, #cbd5e1 75%, #f8fafc 100%)',
        backgroundAttachment: 'fixed',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      {/* Header */}
      <GlassContainer className="p-8 bg-gradient-to-r from-white/30 to-slate-50/20">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
          <div className="mb-8 xl:mb-0">
            <h1 className="text-4xl font-bold mb-3 text-slate-800 flex items-center">
              <BarChart3 className="w-10 h-10 mr-4 text-slate-500" />
              Stratytics
            </h1>
            <p className="text-slate-600 text-xl">
              Theo dõi năng suất và hiệu quả công việc với Stratix
            </p>
          </div>

          <div className="flex items-center space-x-6 bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-slate-200/30 shadow-[0_8px_32px_rgba(148,163,184,0.08)]">
            <Calendar className="w-6 h-6 text-slate-600" />
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">Khoảng thời gian</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-white/30 text-slate-800 px-4 py-2 rounded-xl border border-slate-200/40 focus:ring-2 focus:ring-slate-300/50 font-semibold backdrop-blur-sm shadow-[inset_0_2px_4px_rgba(148,163,184,0.1)]"
              >
                <option value="all" className="text-slate-900">Tất cả</option>
                <option value="week" className="text-slate-900">7 ngày qua</option>
                <option value="month" className="text-slate-900">30 ngày qua</option>
              </select>
            </div>
          </div>
        </div>
      </GlassContainer>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard
          icon={Target}
          title="Tổng công việc"
          value={analyticsData.totalTasks}
          subtitle={selectedPeriod === 'all' ? 'Tất cả thời gian' : selectedPeriod === 'week' ? '7 ngày qua' : '30 ngày qua'}
          iconBg="bg-gradient-to-br from-slate-100 to-slate-200"
        />

        <MetricCard
          icon={Award}
          title="Tỷ lệ hoàn thành"
          value={`${analyticsData.completionRate}%`}
          subtitle="Hiệu suất làm việc"
          iconBg="bg-gradient-to-br from-slate-200 to-slate-300"
          trend={{ type: 'up', value: '+5%' }}
        />

        <MetricCard
          icon={Zap}
          title="Đang thực hiện"
          value={analyticsData.inProgressTasks}
          subtitle="Công việc đang hoạt động"
          iconBg="bg-gradient-to-br from-slate-100 to-slate-200"
        />

        <MetricCard
          icon={AlertTriangle}
          title="Trễ hạn"
          value={analyticsData.overdueTasks.length}
          subtitle="Cần ưu tiên xử lý"
          iconBg="bg-gradient-to-br from-red-100 to-red-200"
          trend={analyticsData.overdueTasks.length > 0 ? { type: 'down', value: '-2' } : { type: 'stable', value: '0' }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <DonutChart
          data={analyticsData.statusData}
          title="Phân bố theo trạng thái"
        />

        <DonutChart
          data={analyticsData.priorityData}
          title="Phân bố theo độ ưu tiên"
        />
      </div>

      {/* Advanced Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <TimelineChart
          data={analyticsData.completionData}
          title="Tiến độ hoàn thành theo thời gian"
        />

        <SimpleRadarChart
          data={analyticsData.performanceData}
          title="Đánh giá hiệu suất tổng thể"
        />
      </div>

      {/* Daily Progress */}
      <WaveProgressChart
        data={analyticsData.completionData}
        title="Tiến độ hoàn thành hàng ngày (7 ngày qua)"
      />

      {/* Alert Section */}
      <AlertCard overdueTasks={analyticsData.overdueTasks} />

      {/* Export Section */}
      <ExportSection
        onExport={handleExport}
        isExporting={isExporting}
        hasData={filteredTasks.length > 0}
      />

      {/* Productivity Insights */}
      <ProductivityInsights analyticsData={analyticsData} />
    </div>
  );
}