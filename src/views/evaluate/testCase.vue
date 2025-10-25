<template>
    <el-drawer v-model="props.visible" @close="handleClose" :show-close="props.rowData?.testingTask?.taskStatus !== 'success'" size="80%"
        :destroy-on-close="false">
        <template #header>
            <h4 class="drawer-title">{{ props.rowData?.testingName }}</h4>
            <el-button v-if="props.rowData?.testingTask?.taskStatus === 'success'" @click="handleDownloadReport" >
                {{ $t('btnText.downloadReport') }}
            </el-button>
        </template>
        <template #default>
            <div class="empty_box" v-if="props.rowData?.status === 'pending'">
                <div class="empty_img empty_pending"></div>
                <div class="empty_text">{{ $t('testing.testingStatus.pending') }}</div>
            </div>
            <div class="empty_box" v-else-if="props.rowData?.status === 'failed'">
                <div class="empty_img empty_failed"></div>
                <div class="empty_text">{{ $t('testing.testingStatus.failed') }}</div>
            </div>
            <div class="empty_box" v-else-if="props.rowData?.status === 'running'">
                <div class="empty_img empty_running"></div>
                <div class="empty_text">{{ $t('testing.testingStatus.running') }}</div>
            </div>
            <div v-else>
                <div class="chart-container">
                    <div id="rightChart"></div>
                    <div id="leftChart"></div>
                </div>
                <div class="table-container">
                    <el-table :data="testCaseList" row-key="id" height="calc(100vh - 464px)" bordered>
                        <template #empty>
                            <div class="table-empty-box">
                                <div class="table-empty-img"></div>
                                <div>暂无数据</div>
                            </div>
                        </template>
                        <el-table-column prop="question" width="150" :label="$t('dataset.question')" fixed>
                            <template #default="scope">
                                <el-tooltip
                                   
                                    effect="dark"
                                    :content="scope.row.question"
                                    placement="top"
                                >
                                    <div class="table-row-content">{{ scope.row.question }}</div>
                                </el-tooltip>
                            </template>
                        </el-table-column>
                        <el-table-column prop="answer" width="300" :label="$t('dataset.standardAnswer')" fixed >
                            <template #default="scope">
                                <el-tooltip
                                   
                                    effect="dark"
                                    :content="scope.row.answer"
                                    placement="top"
                                >
                                    <div class="table-row-content">{{ scope.row.answer }}</div>
                                </el-tooltip>
                            </template>
                        </el-table-column>
                        <el-table-column prop="llmAnswer" width="300" :label="$t('testing.modelAnswer')" >
                            <template #default="scope">
                                <el-tooltip
                                   
                                    effect="dark"
                                    :content="scope.row.llmAnswer"
                                    placement="top"
                                >
                                    <div class="table-row-content">{{ scope.row.llmAnswer }}</div>
                                </el-tooltip>
                            </template>
                        </el-table-column>
                        <el-table-column prop="relatedChunk" width="300" :label="$t('testing.retrievedSegments')" >
                            <template #default="scope">
                                <el-tooltip
                                   
                                    effect="dark"
                                    :content="scope.row.relatedChunk"
                                    placement="top"
                                >
                                    <div class="table-row-content">{{ scope.row.relatedChunk }}</div>
                                </el-tooltip>
                            </template>
                        </el-table-column>
                        <el-table-column prop="docName" width="150" :label="$t('dataset.sourceDoc')" >
                            <template #default="scope">
                                <el-tooltip
                                   
                                    effect="dark"
                                    :content="scope.row.docName"
                                    placement="top"
                                >
                                    <div class="table-row-content">{{ scope.row.docName }}</div>
                                </el-tooltip>
                            </template>
                        </el-table-column>
                        <el-table-column prop="score" width="150" :label="$t('testing.testingScore')" />
                        <el-table-column prop="pre" width="60" :label="$t('testing.accurateRate')" fixed="right" />
                        <el-table-column prop="rec" width="60" :label="$t('testing.recallRate')" fixed="right" />
                        <el-table-column prop="fai" width="60" :label="$t('testing.fidelity')" fixed="right" />
                        <el-table-column prop="rel" width="90" :label="$t('testing.interpretability')" fixed="right" />
                        <el-table-column prop="lcs" width="120" :label="$t('testing.longestScore')" fixed="right" />
                        <el-table-column prop="leve" width="100" :label="$t('testing.editDistanceScore')" fixed="right" />
                        <el-table-column prop="jac" width="120" :label="$t('testing.Jaccard')" fixed="right" />
                    </el-table>
                    <el-pagination v-model:current-page="currentPage" v-model:page-size="currentPageSize"
                        :page-sizes="pagination.pageSizes" :layout="pagination.layout" :total="totalCount"
                        popper-class="testCasePage" @change="handleChangePage" />
                </div>
            </div>
        </template>
        <template #footer>
            <el-button @click="handleClose">{{ $t('btnText.close') }}</el-button>
        </template>
    </el-drawer>
</template>
<script lang='ts' setup>
import EvaluateAPI from '@/api/evaluate';
import * as echarts from 'echarts';
import { onMounted, onBeforeUnmount, watch, nextTick, ref } from 'vue';
import { downloadFun } from '@/utils/downloadFun';

const { t } = useI18n();
const props = defineProps({
    visible: Boolean,
    rowData: Object,
    close: Function,
});

const currentPage = ref(1);
const totalCount = ref(0);
const currentPageSize = ref(20);
const pagination = ref({
    pageSizes: [10, 20, 30, 40, 50],
    layout: 'total,sizes,prev,pager,next,jumper',
});

const handleChangePage = (pageNum: number, pageSize: number) => {
    currentPage.value = pageNum;
    currentPageSize.value = pageSize;
    queryTestCase();
};

let chartInstanceR: echarts.ECharts | null = null;
let chartInstanceL: echarts.ECharts | null = null;

const testCaseAvg = ref({
    aveScore:0,
    avePre:0,
    aveRec:0,
    aveFai:0,
    aveRel:0,
    aveLcs:0,
    aveLeve:0,
    aveJac:0,
})
const testCaseList = ref([]);

const initChart = async () => {
    const isDarkMode = document.body.getAttribute('theme') === 'dark';
    try {
        // 等待DOM更新
        await nextTick();

        // 基于准备好的dom，初始化echarts实例
        const chartDom = document.getElementById('rightChart');
        const chartDomL = document.getElementById('leftChart');
        if (!chartDom || !chartDomL) {
            console.error(t('testing.chartDomNotFound'));
            return;
        }

        // 如果已经有实例，先销毁
        if (chartInstanceR) {
            chartInstanceR.dispose();
        }
        if (chartInstanceL) {
            chartInstanceL.dispose();
        }

        chartInstanceR = echarts.init(chartDom);
        chartInstanceL = echarts.init(chartDomL);

        chartInstanceR.setOption({
            title: {
                text: t('testing.testingScore'),
                left: 'left',
                textStyle: {
                    fontSize: 14,
                    color: isDarkMode ? 'white' : 'black', // 动态更新颜色
                    fontWeight: '700',
                }
            },
            series: [
                {
                    type: 'gauge',
                    min: 0, //最大值
                    max: 100, //最小值
                    startAngle: 225, //仪表盘起始角度。正右手侧为0度，正上方为90度，正左手侧为180度。
                    endAngle: -45, //仪表盘结束角度
                    radius:'95px', 
                    center: ['50%', '55%'], // 调整表盘垂直位置，增加与标题的距离
                    itemStyle: {
                        color: '#f37215', //颜色
                    },
                    progress: {
                        show: true, //是否显示进度条
                        width: 10, //进度条宽度
                        itemStyle: {
                            color: {
                                type: 'linear',
                                x: 1,
                                y: 0,
                                x2: 0,
                                y2: 1,
                                colorStops: [
                                    {
                                        offset: 1,
                                        color: 'green' // 0% 处的颜色
                                    },
                                    {
                                        offset: 0.6,
                                        color: 'yellow' // 100% 处的颜色
                                    },
                                    {
                                        offset: 0.2,
                                        color: 'orange' // 100% 处的颜色
                                    },
                                    {
                                        offset: 0,
                                        color: 'red' // 100% 处的颜色
                                    }
                                ],
                                global: false // 缺省为 false
                            }
                        }
                    },
                    pointer: {
                        icon: 'triangle',
                        width: 8,
                        length: '10px',
                        itemStyle: {
                            color: isDarkMode ? 'white' : 'black', // 动态更新箭头颜色
                            shadowColor: 'rgba(0,0,0,0.3)',
                            shadowBlur: 8
                        },
                        offsetCenter: [0, '-56px'], //相对于仪表盘中心的偏移位置
                    },
                    axisLine: {
                        show: true, // 启用仪表盘轴线以显示背景
                        lineStyle: {
                            color: [
                                [1, isDarkMode ?'#3E4551':'#DEE4EE'] // 未走到部分颜色
                            ],
                        }
                    },
                    axisTick: {
                        show: false, //是否显示刻度
                    },
                    splitLine: {
                        show: false, //是否显示分隔线
                    },
                    axisLabel: {
                        show: false, //是否显示标签
                    },
                    title: {
                        show: true, //是否显示标题
                    },
                    detail: {
                        show: true, //是否显示详情
                        valueAnimation: true, //是否开启标签的数字动画
                        offsetCenter: [0, 0], //相对于仪表盘中心的偏移位置
                        fontSize: 32, //文字的字体大小
                        color: isDarkMode ? 'white' : 'black', // 动态更新颜色
                        fontWeight: 'bolder', //文字字体的粗细
                        backgroundColor: isDarkMode ? 'rgb(42 47 55)' : 'white', // 动态更新背景颜色
                        borderRadius: 100, // 设置圆形边框
                        padding: [10, 10, 10, 10], // 设置内边距使背景更大
                        width: 120, // 设置背景宽度
                        height: 120, // 设置背景高度
                        shadowColor: isDarkMode?'#22262D':'rgba(141,152,170,0.4)',
                        shadowBlur: 20, // 阴影模糊大小
                        shadowOffsetX: 2, //阴影水平方向上的偏移距离
                        shadowOffsetY: 16, //阴影垂直方向上的偏移距离
                    },
                    data: [
                        {
                            value: props.rowData?.aveScore >= 0 ? props.rowData?.aveScore : 0,
   
                        }
                    ]
                }
            ]
        });
        const { avePre, aveRec, aveFai, aveRel,  aveLcs, aveLeve, aveJac } = testCaseAvg.value;
        chartInstanceL.setOption({
            color: ['rgb(141,152,170)'],
            textStyle: {
                color: 'rgb(141,152,170)' 
            },
            lineStyle: {
                color: 'rgb(141,152,170)'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },
                backgroundColor: isDarkMode ? 'rgba(50, 50, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: isDarkMode ? '#666' : '#ccc',
                borderWidth: 1,
                textStyle: {
                    color: isDarkMode ? '#fff' : '#333',
                    fontSize: 12
                },
                formatter: function(params) {
                    const dataIndex = params[0].dataIndex;
                    const value = params[0].value;
                    const name = params[0].name;
                    return `${name}<br/>${t('testing.scoreY')}: ${value.toFixed(2)}`;
                }
            },
            grid: {
                left: '1%',    // 左侧距离容器3%宽度（百分比更适配响应式）
                right: '1%',   // 右侧距离容器3%宽度
                bottom: '1%',   // 底部距离容器3%宽度
                top: '25%',    // 顶部距离容器3%宽度
                containLabel: true // 确保坐标轴标签不被截断[3,5](@ref)
            },
            title: {
                text: t('testing.evaluationQuality'),
                textStyle: {
                    fontSize: 14,
                    color: isDarkMode ? 'white' : 'black' // 动态设置标题颜色
                }
            },
            xAxis: {
                data: [
                    t('testing.avg')+t('testing.accurateRate'), 
                    t('testing.avg')+t('testing.recallRate'), 
                    t('testing.avg')+t('testing.fidelity'), 
                    t('testing.avg')+t('testing.interpretability'), 
                    t('testing.avg')+t('testing.longestScore'), 
                    t('testing.avg')+t('testing.editDistanceScore'), 
                    t('testing.avg')+t('testing.Jaccard'), 
                ],
                axisTick: {
                    show: false
                },
                axisLine: {
                    lineStyle:  {
                        type: 'solid',
                        color: 'rgb(223,229,239)',
                        width: 3,
                    }
                },
                axisLabel: {
                    interval: 0 // 确保所有标签都显示
                }
            },
            yAxis: {
                interval: 50,
                type: 'value',
                name: t('testing.scoreY'),
                textStyle: {
                    color: 'black',
                },
                nameTextStyle: {
                    color: isDarkMode ? '#C0C8D5' : '#666F7A', // 动态设置Y轴顶部文字颜色
                    padding: [0, 0, 0, 2],
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        type: 'dashed',
                        color: 'rgb(141,152,170)',
                        dash: [30, 15],   // [实线长度, 间隔长度]（数值越大越稀疏）
                        opacity: 0.5
                    },
                },
                axisLabel: {
                    align: 'left',
                    padding: [0, 0, 0, -20],
                }
            },
            series: [
                {
                    type: 'bar',
                    data: [avePre, aveRec, aveFai, aveRel, aveLcs, aveLeve, aveJac],
                    barWidth: 8,
                    itemStyle: {
                        color: 'rgb(0,98,220)',
                        borderWidth: 1,
                        shadowColor: 'rgba(0,92,219,0.2)',
                        shadowBlur: 10,
                        shadowOffsetX: 4,
                        shadowOffsetY: 8,
                    }
                }
            ]
        })
    } catch (error) {
        console.error('Failed to initialize chart:', error);
    }
}

// 监听主题变化
const handleThemeChange = () => {
    const isDarkMode = document.body.getAttribute('theme') === 'dark';
    if (chartInstanceR) {
        chartInstanceR.setOption({
            title: {
                textStyle: {
                    color: isDarkMode ? 'white' : 'black', // 动态更新颜色
                }
            },
            series:[{
                detail:{
                    color: isDarkMode ? 'white' : 'black', // 动态更新颜色
                    backgroundColor: isDarkMode ? 'rgb(42 47 55)' : 'white', // 动态更新背景颜色
                    shadowColor: isDarkMode?'#22262D':'rgba(141,152,170,0.4)',
                },
                pointer: {
                    itemStyle: {
                        color: isDarkMode ? 'white' : 'black', // 动态更新箭头颜色
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: [
                            [1, isDarkMode ?'#3E4551':'#DEE4EE'] // 未走到部分颜色
                        ],
                    }
                }
            }]
        });
        chartInstanceR.resize(); // 确保图表重新渲染
    }
    if (chartInstanceL) {
        chartInstanceL.setOption({
            title: {
                textStyle: {
                    color: isDarkMode ? 'white' : 'black' // 动态设置标题颜色
                }
            },
            yAxis: {
                nameTextStyle: {
                    color: isDarkMode ? '#C0C8D5' : '#666F7A' // 动态设置Y轴顶部文字颜色
                }
            }
        });
        chartInstanceL.resize(); // 确保图表重新渲染
    }
};

const handleMessage = (event: MessageEvent) => {
    if(event.data.type === 'changeLanguage'){
        initChart();
    }
}
// 响应式调整函数
function resizeChart() {
  if (chartInstanceL) {
    chartInstanceL.resize()
  }
  if (chartInstanceR) {
    chartInstanceR.resize()
  }
}
// 监听窗口大小变化
onMounted(() => {
    // 添加窗口大小变化监听
    window.addEventListener('resize', resizeChart)
    window.addEventListener('message',handleMessage );
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.body, { attributes: true, attributeFilter: ['theme'] }); // 监听主题变化
    onBeforeUnmount(() => observer.disconnect()); // 组件销毁时断开监听
});
onUnmounted(() => window.removeEventListener('message', handleMessage));

const queryTestCase = ()=>{
    let params={
        page:currentPage.value,
        pageSize:currentPageSize.value,
        testingId: props.rowData?.testingId
    }
    EvaluateAPI.testingCase(params).then((res:any) => {
        const safe = (v: number) => v < 0 ? 0 : v;
        const { aveScore, avePre, aveRec, aveFai, aveRel, aveLcs, aveLeve, aveJac, testCases, total } = res;
        testCaseAvg.value = {
            aveScore: safe(aveScore),
            avePre: safe(avePre),
            aveRec: safe(aveRec),
            aveFai: safe(aveFai),
            aveRel: safe(aveRel),
            aveLcs: safe(aveLcs),
            aveLeve: safe(aveLeve),
            aveJac: safe(aveJac),
        };
        testCaseList.value = testCases;
        totalCount.value = total;
    }).finally(() => {
        // 初始化图表
        initChart();
    })
}

// 监听visible变化，处理图表清理和主题切换
watch(() => props.visible, (newVal) => {
    if (newVal) {
        // drawer打开时初始化数据并切换主题
        queryTestCase();
    } else {
        // drawer关闭时清理图表实例
        if (chartInstanceR) {
            chartInstanceR.dispose();
            chartInstanceR = null;
        }
        if (chartInstanceL) {
            chartInstanceL.dispose();
            chartInstanceL = null;
        }
    }
}, { immediate: true });

// 组件销毁前清理
onBeforeUnmount(() => {
    if (chartInstanceR) {
        chartInstanceR.dispose();
        chartInstanceR = null;
    }
    if (chartInstanceL) {
        chartInstanceL.dispose();
        chartInstanceL = null;
    }
});

const handleClose = () => {
    props.close?.();
}

const handleDownloadReport = () => {
    const url = `${window.origin}/witchaind/api/testing/download?testingId=${props.rowData?.testingId}`;
    downloadFun(url);
}
</script>

<style lang="scss">
.el-drawer__header {
    padding: 24px 24px 0;
    margin-bottom: 0;

    .drawer-title {
        font-size: 16px;
        font-weight: 700;
        color: var(--o-text-color-primary);
        line-height: 32px;
    }
}

.el-drawer__body {
    padding: 16px 24px;
}

.chart-container {
    display: flex;
    gap: 16px;

    #rightChart {
        width: 30%;
        height: 256px;
        min-width: 233px;
        background-color: var(--o-bg-color-light);
        border-radius: 8px;
        padding: 16px 16px 0;
        display: flex;
        justify-content: center;
    }

    #leftChart {
        width: calc(100vw - 30%);
        height: 256px;
        background-color: var(--o-bg-color-light);
        border-radius: 8px;
        padding: 16px;
    }
}

.table-container {
    margin-top: 16px;
    overflow-x: auto; // 添加横向滚动支持

    .el-table {
        min-width: 1200px; // 设置表格的最小宽度，确保中间列在小屏幕上不会被隐藏
    }

    .el-table.is-scrolling-left.el-table--border .el-table-fixed-column--left.is-last-column.el-table__cell {
        border-right: unset !important;
    }

    .el-table.is-scrolling-left th.el-table-fixed-column--right,
    .el-table.is-scrolling-left th.el-table-fixed-column--left,
    .el-table.is-scrolling-middle th.el-table-fixed-column--right,
    .el-table.is-scrolling-middle th.el-table-fixed-column--left,
    .el-table.is-scrolling-right th.el-table-fixed-column--right,
    .el-table.is-scrolling-right th.el-table-fixed-column--left {
        background-color: #f4f6fa;

    }

    .el-table__header {
        width: 100% !important;
        height: 32px;
        box-shadow: inset 0 -1px 0 0 rgb(223 229 239);

        thead tr th {
            background-color: #f4f6fa;
        }
    }

    .el-table__body {
        width: 100% !important;

        .el-table__row {
            height: 48px;
        }
    }

    .el-table__cell {
        padding: 0 8px !important;
        font-size: 12px;
        color: black;
    }
    .group-selection::after {
        content: unset !important;
    }

    .el-pagination {
        margin-top: 16px;
    }

    .el-pagination .el-input__inner {
        height: var(--el-input-inner-height) !important;
    }

}

.el-drawer__footer {
    box-shadow: 0 -8px 16px 0 rgba(0, 0, 0, 0.1);
    padding: 8px 24px;
}
.testCasePage{
    inset: auto auto 108px 657px !important;
}
</style>