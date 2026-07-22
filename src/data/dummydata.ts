import { getCellValue } from '../getCellValue'
import type { HeaderState, PageResponse, Pageable } from '../types'

export type {
  CellRender,
  CellRenderArgs,
  ColumnDef,
  ColumnKey,
  HeaderState,
  Pageable,
  PageResponse,
} from '../types'

export type AssetUser = {
  id: number
  name: string | null
  username?: string | null
  email?: string | null
}

export type AssetCustomCode = {
  keyString: number
  valueString: string | null
  isRemoved: boolean
}

export type AssetCustomString = {
  keyString: number
  valueString: string | null
  isRemoved: boolean
}

export type Asset = {
  id: number
  assetName: string | null
  assetCode: string | null
  etc: string | null
  operator: AssetUser[]
  handler: AssetUser[]
  createdAt: string | null
  updatedAt: string | null
  endOfService: string | null
  involvedIntoCompose: boolean
  importDate: string | null
  importPrice: string | null
  mngPrice: string | null
  mngRate: string | null
  assetCustomCodes: AssetCustomCode[]
  assetCustomStrings: AssetCustomString[]
  groupName: string | null
  taskName: string | null
  locationName: string | null
  slaGroupName: string | null
  departmentName: string | null
  projectName: string | null
  mngPrimaryName: string | null
  mngSecondaryName: string | null
  mngTertiaryName: string | null
  createdByName: string | null
  updatedByName: string | null
  removed: boolean
}

export type AssetPageResponse = PageResponse<Asset> & {
  content: Asset[]
  pageable: NonNullable<PageResponse<Asset>['pageable']> & {
    pageNumber: number
    pageSize: number
    offset: number
    paged: boolean
    unpaged: boolean
  }
  totalPages: number
  totalElements: number
  last: boolean
  size: number
  number: number
  numberOfElements: number
  first: boolean
  empty: boolean
}

/** 데모용 헤더 정의 — default:true 가 저장 없을 때·리셋 시 기본 표시 */
export const ASSET_LIST_HEADER: HeaderState[] = [
  { key: 'assetName', label: '자산명', type: 'text', minWidth: 300, default: true, visible: true },
  { key: 'assetCode', label: '자산코드', type: 'text', width: 120, default: true, visible: true },
  { key: 'groupName', label: '자산그룹', type: 'text', width: 140, default: true, visible: true },
  { key: 'taskName', label: '업무그룹', type: 'text', width: 140, default: true, visible: true },
  { key: 'locationName', label: '자산위치', type: 'text', width: 140, default: true, visible: true },
  { key: 'departmentName', label: '부서', type: 'text', width: 140, default: true, visible: true },
  { key: 'projectName', label: '시스템', type: 'text', width: 140, visible: false },
  { key: 'mngPrimaryName', label: '1차 업체', type: 'text', width: 140, default: true, visible: true },
  { key: 'mngSecondaryName', label: '2차 업체', type: 'text', width: 140, visible: false },
  { key: 'mngTertiaryName', label: '3차 업체', type: 'text', width: 140, visible: false },
  { key: 'importDate', label: '도입일자', type: 'text', width: 140, visible: false },
  { key: 'importPrice', label: '도입금액', type: 'text', width: 140, visible: false },
  { key: 'mngPrice', label: '유지보수액', type: 'text', width: 140, visible: false },
  { key: 'operator', label: '운영담당자', type: 'text', width: 140, visible: false },
  { key: 'handler', label: '자산사용자', type: 'text', width: 140, default: true, visible: true },
  { key: 'createdAt', label: '등록일', type: 'text', width: 140, visible: false },
  { key: 'updatedAt', label: '수정일', type: 'text', width: 140, visible: false },
  { key: 'attach_1', label: '할당아이피', type: 'text', width: 140, filterable: true, visible: false },
  { key: 'attach_2', label: 'SR요청주체', type: 'text', width: 140, filterable: true, visible: false },
]

/** @deprecated ASSET_LIST_HEADER 사용 */
export const ALL_COLUMNS = ASSET_LIST_HEADER

export {
  applyHeaderDefaults,
  applyHeaderState,
  defaultVisibleKeysFromColumns,
  headerSignature,
  mergeHeaderState,
  normalizeHeaderSetting,
  toHeaderState,
  toPersistableHeaders,
  withVisibleOrder,
  visibleKeysFromHeaders,
  SIMMS_HEADER_WIRE_NOTES,
  type AppliedHeaderState,
  type LegacyHeaderSetting,
  type PersistableHeaderState,
} from '../headerState'

export function formatUsers(users: AssetUser[] | null | undefined): string {
  if (!users?.length) return ''
  return users
    .map((user) => user.name)
    .filter(Boolean)
    .join(', ')
}

/** 커스텀 필드를 row 키로 펼쳐 내장 getCellValue가 읽게 함 */
function withFlatAttachFields(asset: Asset): Asset & Record<string, unknown> {
  const flat: Record<string, unknown> = { ...asset }
  for (const item of asset.assetCustomStrings ?? []) {
    if (item.isRemoved || item.valueString == null) continue
    flat[`attach_${item.keyString}`] = item.valueString
  }
  for (const item of asset.assetCustomCodes ?? []) {
    if (item.isRemoved || item.valueString == null) continue
    const key = `attach_${item.keyString}`
    if (flat[key] == null) flat[key] = item.valueString
  }
  return flat as Asset & Record<string, unknown>
}

/** 수기 작성 시드 자산 */
const ASSET_SEED: Asset[] = [
    {
      id: 317,
      assetName: 'DBMS_Oracle12C_업무A_DB',
      assetCode: 'AST_00008',
      etc: '부부가정정보',
      operator: [
        { id: 1, name: '관리자' },
        { id: 2, name: '김민수' },
        { id: 6, name: '강준호' },
        { id: 7, name: '장미진' },
      ],
      handler: [
        { id: 2, name: '김민수' },
        { id: 3, name: '박지훈' },
      ],
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2026-07-07 13:42:14',
      endOfService: '2026-08-10 00:00:00',
      involvedIntoCompose: false,
      importDate: '2025-08-11 00:00:00',
      importPrice: null,
      mngPrice: '10000000',
      mngRate: '15%',
      assetCustomCodes: [
        { keyString: 1, valueString: '소프트웨어', isRemoved: false },
        { keyString: 91, valueString: 'A클래스_하위', isRemoved: false },
        { keyString: 146, valueString: '3.3.3.3', isRemoved: false },
      ],
      assetCustomStrings: [
        { keyString: 1, valueString: '정보1', isRemoved: false },
        { keyString: 6, valueString: '정정보', isRemoved: false },
        { keyString: 17, valueString: '2026-06-25', isRemoved: false },
      ],
      groupName: '서버(물리)',
      taskName: '네트워크 관리',
      locationName: 'Development VPC',
      slaGroupName: '3등급',
      departmentName: null,
      projectName: '신년 프로젝트',
      mngPrimaryName: '아이티센씨티에스',
      mngSecondaryName: '소프트1',
      mngTertiaryName: '굿모',
      createdByName: '장성윤',
      updatedByName: '관리자',
      removed: false,
    },
    {
      id: 280,
      assetName: 'Cisco Nexus 93600CD-GX',
      assetCode: null,
      etc: '데이터센터 집선L3스위치',
      operator: [],
      handler: [
        { id: 4, name: '이영희' },
        { id: 5, name: '최수진' },
        { id: 6, name: '강준호' },
        { id: 7, name: '장미진' },
        { id: 8, name: '김도훈' },
      ],
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2026-04-27 15:38:25',
      endOfService: '2025-09-12 00:00:00',
      involvedIntoCompose: false,
      importDate: '2025-06-17 00:00:00',
      importPrice: null,
      mngPrice: null,
      mngRate: null,
      assetCustomCodes: [{ keyString: 1, valueString: '네트워크장비', isRemoved: false }],
      assetCustomStrings: [],
      groupName: '네트워크 장비',
      taskName: '인프라',
      locationName: '판교 오피스',
      slaGroupName: '1등급',
      departmentName: '인프라',
      projectName: '신년 프로젝트',
      mngPrimaryName: '프롬소프트',
      mngSecondaryName: null,
      mngTertiaryName: null,
      createdByName: '최현복',
      updatedByName: null,
      removed: false,
    },
    {
      id: 279,
      assetName: 'Samsung DDR5 16GB 4800MHz',
      assetCode: '26',
      etc: 'test\n\n123',
      operator: [],
      handler: [
        { id: 6, name: '강준호' },
        { id: 7, name: '장미진' },
        { id: 8, name: '김도훈' },
      ],
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2026-05-24 00:54:22',
      endOfService: null,
      involvedIntoCompose: false,
      importDate: null,
      importPrice: null,
      mngPrice: null,
      mngRate: null,
      assetCustomCodes: [],
      assetCustomStrings: [
        { keyString: 1, valueString: '444', isRemoved: false },
        { keyString: 2, valueString: '2312', isRemoved: false },
        { keyString: 6, valueString: '123', isRemoved: false },
      ],
      groupName: '업무소프트웨어',
      taskName: '계정계',
      locationName: '판교 오피스',
      slaGroupName: null,
      departmentName: '인프라',
      projectName: null,
      mngPrimaryName: null,
      mngSecondaryName: null,
      mngTertiaryName: null,
      createdByName: '관리자',
      updatedByName: '관리자',
      removed: false,
    },
    {
      id: 278,
      assetName: 'Samsung DDR5 16GB 4800MHz_1',
      assetCode: '23_1',
      etc: null,
      operator: [],
      handler: [
        { id: 1, name: '관리자' },
        { id: 2, name: '김민수' },
        { id: 3, name: '박지훈' },
        { id: 4, name: '이영희' },
        { id: 5, name: '최수진' },
      ],
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2026-05-24 16:32:53',
      endOfService: null,
      involvedIntoCompose: false,
      importDate: null,
      importPrice: null,
      mngPrice: '100000',
      mngRate: null,
      assetCustomCodes: [],
      assetCustomStrings: [],
      groupName: '서버(물리)',
      taskName: '웹 개발',
      locationName: '판교 오피스',
      slaGroupName: '4등급',
      departmentName: '인프라',
      projectName: null,
      mngPrimaryName: null,
      mngSecondaryName: null,
      mngTertiaryName: null,
      createdByName: '관리자',
      updatedByName: '관리자',
      removed: false,
    },
    {
      id: 277,
      assetName: 'Seagate Barracuda 1TB 7200RPM SATA 6Gb/s_1',
      assetCode: '   ',
      etc: null,
      operator: [],
      handler: [],
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2025-06-19 13:31:17',
      endOfService: null,
      involvedIntoCompose: false,
      importDate: null,
      importPrice: null,
      mngPrice: null,
      mngRate: null,
      assetCustomCodes: [],
      assetCustomStrings: [],
      groupName: '서버(물리)',
      taskName: '서버관리',
      locationName: '1층',
      slaGroupName: null,
      departmentName: '데브옵스',
      projectName: null,
      mngPrimaryName: null,
      mngSecondaryName: null,
      mngTertiaryName: null,
      createdByName: '관리자',
      updatedByName: '관리자',
      removed: false,
    },
    {
      id: 276,
      assetName: 'Seagate IronWolf 4TB NAS Hard Drive_1',
      assetCode: '24',
      etc: null,
      operator: [],
      handler: [],
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2026-02-03 17:41:53',
      endOfService: null,
      involvedIntoCompose: false,
      importDate: null,
      importPrice: null,
      mngPrice: null,
      mngRate: null,
      assetCustomCodes: [],
      assetCustomStrings: [],
      groupName: '서버(물리)',
      taskName: '네트워크 관리',
      locationName: '로비',
      slaGroupName: null,
      departmentName: '본사',
      projectName: null,
      mngPrimaryName: null,
      mngSecondaryName: null,
      mngTertiaryName: null,
      createdByName: '관리자',
      updatedByName: '관리자',
      removed: false,
    },
    {
      id: 274,
      assetName: 'WD Black 4TB 7200RPM High-Performance HDD_1',
      assetCode: '22',
      etc: null,
      operator: [],
      handler: [],
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2025-06-18 16:12:14',
      endOfService: null,
      involvedIntoCompose: false,
      importDate: null,
      importPrice: null,
      mngPrice: null,
      mngRate: null,
      assetCustomCodes: [],
      assetCustomStrings: [],
      groupName: '서버(물리)',
      taskName: '웹 개발',
      locationName: '소회의실 B',
      slaGroupName: null,
      departmentName: '네트워크팀',
      projectName: '신년 프로젝트',
      mngPrimaryName: '(주)고객',
      mngSecondaryName: '그린테크',
      mngTertiaryName: '화이트엔터프라이즈',
      createdByName: '관리자',
      updatedByName: '관리자',
      removed: false,
    },
    {
      id: 238,
      assetName: '자산코드 테스트 자산',
      assetCode: 'sw123345-0001',
      etc: null,
      operator: [],
      handler: [],
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2025-06-13 10:57:33',
      endOfService: null,
      involvedIntoCompose: false,
      importDate: null,
      importPrice: null,
      mngPrice: null,
      mngRate: null,
      assetCustomCodes: [],
      assetCustomStrings: [{ keyString: 2, valueString: '123', isRemoved: false }],
      groupName: '호스트 서버',
      taskName: null,
      locationName: null,
      slaGroupName: null,
      departmentName: null,
      projectName: null,
      mngPrimaryName: null,
      mngSecondaryName: null,
      mngTertiaryName: null,
      createdByName: '관리자',
      updatedByName: null,
      removed: false,
    },
    {
      id: 237,
      assetName: '영진방화벽-123',
      assetCode: '',
      etc: 'tes\nㅇㄴ\nㅇ\nㄴ\nㅇㄴㅇ\nt',
      operator: [],
      handler: [],
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2025-04-29 13:42:29',
      endOfService: null,
      involvedIntoCompose: false,
      importDate: '2025-04-04 00:00:00',
      importPrice: '10,000,000',
      mngPrice: null,
      mngRate: null,
      assetCustomCodes: [
        { keyString: 1, valueString: '서버하위', isRemoved: false },
        { keyString: 10, valueString: '5555', isRemoved: false },
        { keyString: 34, valueString: 'no', isRemoved: false },
      ],
      assetCustomStrings: [],
      groupName: '가상화 플랫폼',
      taskName: '모바일 앱 개발',
      locationName: null,
      slaGroupName: null,
      departmentName: null,
      projectName: null,
      mngPrimaryName: 'test업체',
      mngSecondaryName: '프롬소프트',
      mngTertiaryName: null,
      createdByName: '김영진',
      updatedByName: '관리자',
      removed: false,
    },
    {
      id: 235,
      assetName: '백업자산 테스터31',
      assetCode: null,
      etc: null,
      operator: [],
      handler: [],
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2026-02-04 16:06:07',
      endOfService: '2025-10-31 00:00:00',
      involvedIntoCompose: false,
      importDate: null,
      importPrice: null,
      mngPrice: '1000000',
      mngRate: '2',
      assetCustomCodes: [
        { keyString: 1, valueString: '서버', isRemoved: false },
        { keyString: 5, valueString: '검색조심', isRemoved: false },
        { keyString: 9, valueString: '222', isRemoved: false },
        { keyString: 10, valueString: '5555', isRemoved: false },
        { keyString: 34, valueString: 'yes', isRemoved: false },
      ],
      assetCustomStrings: [{ keyString: 1, valueString: '스트링', isRemoved: false }],
      groupName: '서버(물리)',
      taskName: '인프라',
      locationName: '판교 오피스',
      slaGroupName: null,
      departmentName: '전략기획부',
      projectName: '신년 프로젝트',
      mngPrimaryName: '레드솔루션',
      mngSecondaryName: null,
      mngTertiaryName: null,
      createdByName: null,
      updatedByName: '신미나',
      removed: false,
    },
    {
      id: 220,
      assetName: '엑셀 롤백 테스트 자산3',
      assetCode: null,
      etc: null,
      operator: [],
      handler: [],
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2025-03-11 09:50:07',
      endOfService: null,
      involvedIntoCompose: false,
      importDate: null,
      importPrice: null,
      mngPrice: null,
      mngRate: null,
      assetCustomCodes: [{ keyString: 34, valueString: 'yes', isRemoved: false }],
      assetCustomStrings: [
        { keyString: 1, valueString: '상태정보 채움', isRemoved: false },
        { keyString: 2, valueString: '테스트정보 커스텀 스트링', isRemoved: false },
      ],
      groupName: '네트워크 장비',
      taskName: null,
      locationName: '1층',
      slaGroupName: '2등급',
      departmentName: '데브옵스',
      projectName: null,
      mngPrimaryName: null,
      mngSecondaryName: null,
      mngTertiaryName: null,
      createdByName: null,
      updatedByName: null,
      removed: false,
    },
    {
      id: 194,
      assetName: '개인피씨1',
      assetCode: 'swHW-0002',
      etc: '250226',
      operator: [],
      handler: [],
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2025-06-13 10:57:33',
      endOfService: null,
      involvedIntoCompose: false,
      importDate: null,
      importPrice: null,
      mngPrice: null,
      mngRate: null,
      assetCustomCodes: [],
      assetCustomStrings: [],
      groupName: '물리서버',
      taskName: '서버관리',
      locationName: null,
      slaGroupName: null,
      departmentName: null,
      projectName: '신년 프로젝트',
      mngPrimaryName: null,
      mngSecondaryName: null,
      mngTertiaryName: null,
      createdByName: '김대희',
      updatedByName: null,
      removed: false,
    },
    {
      id: 193,
      assetName: '운영인력1',
      assetCode: null,
      etc: '김감수\n',
      operator: [],
      handler: [],
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2025-06-13 10:57:33',
      endOfService: null,
      involvedIntoCompose: false,
      importDate: null,
      importPrice: null,
      mngPrice: null,
      mngRate: null,
      assetCustomCodes: [],
      assetCustomStrings: [],
      groupName: 'DBMS',
      taskName: '인프라',
      locationName: null,
      slaGroupName: null,
      departmentName: null,
      projectName: null,
      mngPrimaryName: null,
      mngSecondaryName: null,
      mngTertiaryName: null,
      createdByName: '김대희',
      updatedByName: null,
      removed: false,
    },
    {
      id: 13,
      assetName: '물리서버 #2',
      assetCode: 'AST_00002',
      etc: null,
      operator: [],
      handler: [],
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2025-11-03 10:52:03',
      endOfService: null,
      involvedIntoCompose: false,
      importDate: null,
      importPrice: null,
      mngPrice: null,
      mngRate: null,
      assetCustomCodes: [{ keyString: 1, valueString: '서버', isRemoved: false }],
      assetCustomStrings: [],
      groupName: '서버(물리)',
      taskName: '서버관리',
      locationName: '개발팀 구역',
      slaGroupName: '1등급',
      departmentName: null,
      projectName: '통합ITO',
      mngPrimaryName: null,
      mngSecondaryName: null,
      mngTertiaryName: null,
      createdByName: '관리자',
      updatedByName: '이동희',
      removed: false,
    },
    {
      id: 11,
      assetName: '물리서버#1',
      assetCode: 'AST_00001',
      etc: null,
      operator: [],
      handler: [],
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2025-11-03 10:49:25',
      endOfService: null,
      involvedIntoCompose: false,
      importDate: null,
      importPrice: null,
      mngPrice: null,
      mngRate: null,
      assetCustomCodes: [{ keyString: 1, valueString: '서버', isRemoved: false }],
      assetCustomStrings: [],
      groupName: '서버(물리)',
      taskName: '인프라',
      locationName: '회의실 201',
      slaGroupName: '1등급',
      departmentName: null,
      projectName: '통합ITO',
      mngPrimaryName: null,
      mngSecondaryName: null,
      mngTertiaryName: null,
      createdByName: '관리자',
      updatedByName: '이동희',
      removed: false,
    },
    {
      id: 2,
      assetName: '하이퍼바이저#1',
      assetCode: '',
      etc: null,
      operator: [],
      handler: [],
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2025-10-22 20:29:21',
      endOfService: null,
      involvedIntoCompose: false,
      importDate: null,
      importPrice: null,
      mngPrice: null,
      mngRate: null,
      assetCustomCodes: [{ keyString: 1, valueString: '서버', isRemoved: false }],
      assetCustomStrings: [],
      groupName: '서버(물리)',
      taskName: '서버관리',
      locationName: '테스트 서버실',
      slaGroupName: '1등급',
      departmentName: null,
      projectName: '통합ITO',
      mngPrimaryName: null,
      mngSecondaryName: null,
      mngTertiaryName: null,
      createdByName: '관리자',
      updatedByName: '김진태',
      removed: false,
    },
    {
      id: 1,
      assetName: 'Intel Core i3_2',
      assetCode: 'i3',
      etc: null,
      operator: [
        { id: 1, name: '관리자' },
        { id: 2, name: '김민수' },
        { id: 3, name: '박지훈' },
        { id: 6, name: '강준호' },
        { id: 7, name: '장미진' },
      ],
      handler: [
        { id: 4, name: '이영희' },
        { id: 5, name: '최수진' },
      ],
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2026-02-03 17:42:36',
      endOfService: null,
      involvedIntoCompose: false,
      importDate: null,
      importPrice: '123',
      mngPrice: null,
      mngRate: '123',
      assetCustomCodes: [],
      assetCustomStrings: [
        { keyString: 1, valueString: '123', isRemoved: false },
        { keyString: 6, valueString: '123', isRemoved: false },
      ],
      groupName: 'CPU',
      taskName: '서버관리',
      locationName: '서버 랙 R-02',
      slaGroupName: null,
      departmentName: null,
      projectName: null,
      mngPrimaryName: null,
      mngSecondaryName: null,
      mngTertiaryName: null,
      createdByName: '관리자',
      updatedByName: '관리자',
      removed: false,
    },
]

const EXTRA_ASSET_TEMPLATES: Array<{
  assetName: string
  groupName: string
  taskName: string
  locationName: string
  departmentName: string | null
  projectName: string | null
  mngPrimaryName: string | null
  etc: string | null
  category: string
}> = [
  { assetName: 'Dell PowerEdge R760', groupName: '서버(물리)', taskName: '서버관리', locationName: 'IDC 가산 A동', departmentName: '인프라', projectName: '클라우드 전환', mngPrimaryName: '아이티센씨티에스', etc: '웹 애플리케이션 서버', category: '서버' },
  { assetName: 'HPE ProLiant DL380 Gen11', groupName: '서버(물리)', taskName: '서버관리', locationName: 'IDC 가산 B동', departmentName: '인프라', projectName: '신년 프로젝트', mngPrimaryName: '프롬소프트', etc: 'DB 백엔드 서버', category: '서버' },
  { assetName: 'Lenovo ThinkSystem SR650', groupName: '서버(물리)', taskName: '인프라', locationName: '판교 오피스', departmentName: '인프라', projectName: 'ERP 고도화', mngPrimaryName: '소프트1', etc: null, category: '서버' },
  { assetName: 'VMware ESXi Host-01', groupName: '서버(가상)', taskName: '가상화', locationName: 'Development VPC', departmentName: '클라우드', projectName: '클라우드 전환', mngPrimaryName: '아이티센씨티에스', etc: '개발 클러스터 노드', category: '가상화' },
  { assetName: 'VMware ESXi Host-02', groupName: '서버(가상)', taskName: '가상화', locationName: 'Production VPC', departmentName: '클라우드', projectName: '클라우드 전환', mngPrimaryName: '아이티센씨티에스', etc: '운영 클러스터 노드', category: '가상화' },
  { assetName: 'AWS EC2 m6i.xlarge', groupName: '클라우드', taskName: '클라우드', locationName: 'ap-northeast-2', departmentName: '클라우드', projectName: 'MSA 전환', mngPrimaryName: null, etc: 'API Gateway 백엔드', category: '클라우드' },
  { assetName: 'Azure VM D4s_v5', groupName: '클라우드', taskName: '클라우드', locationName: 'Korea Central', departmentName: '클라우드', projectName: 'MSA 전환', mngPrimaryName: null, etc: null, category: '클라우드' },
  { assetName: 'Cisco Catalyst 9300', groupName: '네트워크 장비', taskName: '네트워크 관리', locationName: 'IDC 가산 A동', departmentName: '인프라', projectName: '네트워크 개편', mngPrimaryName: '프롬소프트', etc: '액세스 스위치', category: '네트워크장비' },
  { assetName: 'Cisco ASR 1001-X', groupName: '네트워크 장비', taskName: '네트워크 관리', locationName: 'IDC 가산 B동', departmentName: '인프라', projectName: '네트워크 개편', mngPrimaryName: '프롬소프트', etc: 'WAN 라우터', category: '네트워크장비' },
  { assetName: 'Fortinet FortiGate 200F', groupName: '보안 장비', taskName: '보안', locationName: 'IDC 가산 A동', departmentName: '보안', projectName: '보안 강화', mngPrimaryName: '굿모', etc: '경계 방화벽', category: '보안장비' },
  { assetName: 'Palo Alto PA-3220', groupName: '보안 장비', taskName: '보안', locationName: '판교 오피스', departmentName: '보안', projectName: '보안 강화', mngPrimaryName: '굿모', etc: null, category: '보안장비' },
  { assetName: 'F5 BIG-IP i5600', groupName: '네트워크 장비', taskName: '네트워크 관리', locationName: 'IDC 가산 A동', departmentName: '인프라', projectName: '신년 프로젝트', mngPrimaryName: '아이티센씨티에스', etc: 'L7 로드밸런서', category: '네트워크장비' },
  { assetName: 'NetApp AFF A400', groupName: '스토리지', taskName: '스토리지', locationName: 'IDC 가산 B동', departmentName: '인프라', projectName: '스토리지 증설', mngPrimaryName: '소프트1', etc: 'NAS/SAN 통합', category: '스토리지' },
  { assetName: 'Dell PowerStore 500T', groupName: '스토리지', taskName: '스토리지', locationName: 'IDC 가산 A동', departmentName: '인프라', projectName: '스토리지 증설', mngPrimaryName: '아이티센씨티에스', etc: null, category: '스토리지' },
  { assetName: 'Synology RS3621xs+', groupName: '스토리지', taskName: '백업', locationName: '판교 오피스', departmentName: '인프라', projectName: '백업 체계', mngPrimaryName: null, etc: '부서 공용 NAS', category: '스토리지' },
  { assetName: 'Oracle Database 19c', groupName: '소프트웨어', taskName: 'DB관리', locationName: 'Production VPC', departmentName: 'DBA', projectName: 'ERP 고도화', mngPrimaryName: '아이티센씨티에스', etc: '기간계 DB', category: '소프트웨어' },
  { assetName: 'PostgreSQL 16 Cluster', groupName: '소프트웨어', taskName: 'DB관리', locationName: 'Development VPC', departmentName: 'DBA', projectName: 'MSA 전환', mngPrimaryName: null, etc: '마이크로서비스 DB', category: '소프트웨어' },
  { assetName: 'Redis 7 Sentinel', groupName: '소프트웨어', taskName: '미들웨어', locationName: 'Production VPC', departmentName: '개발', projectName: 'MSA 전환', mngPrimaryName: null, etc: '세션/캐시', category: '소프트웨어' },
  { assetName: 'Kafka Cluster-01', groupName: '소프트웨어', taskName: '미들웨어', locationName: 'Production VPC', departmentName: '개발', projectName: 'MSA 전환', mngPrimaryName: '소프트1', etc: '이벤트 스트리밍', category: '소프트웨어' },
  { assetName: 'Nginx Ingress Controller', groupName: '소프트웨어', taskName: '미들웨어', locationName: 'k8s-prod', departmentName: '클라우드', projectName: '클라우드 전환', mngPrimaryName: null, etc: null, category: '소프트웨어' },
  { assetName: 'Windows Server 2022 STD', groupName: '소프트웨어', taskName: '서버관리', locationName: '판교 오피스', departmentName: '인프라', projectName: '신년 프로젝트', mngPrimaryName: '프롬소프트', etc: 'Active Directory', category: '소프트웨어' },
  { assetName: 'RHEL 9.4 Enterprise', groupName: '소프트웨어', taskName: '서버관리', locationName: 'IDC 가산 A동', departmentName: '인프라', projectName: '클라우드 전환', mngPrimaryName: '아이티센씨티에스', etc: 'OS 라이선스', category: '소프트웨어' },
  { assetName: 'MacBook Pro 14 M3', groupName: 'PC/노트북', taskName: '단말관리', locationName: '역삼 오피스', departmentName: '개발', projectName: null, mngPrimaryName: null, etc: '개발자 지급', category: '단말' },
  { assetName: 'LG Gram 16 2025', groupName: 'PC/노트북', taskName: '단말관리', locationName: '판교 오피스', departmentName: '기획', projectName: null, mngPrimaryName: null, etc: null, category: '단말' },
  { assetName: 'Dell UltraSharp U2723QE', groupName: '주변기기', taskName: '단말관리', locationName: '역삼 오피스', departmentName: '개발', projectName: null, mngPrimaryName: null, etc: '4K 모니터', category: '주변기기' },
  { assetName: 'HP LaserJet Pro M404dn', groupName: '주변기기', taskName: '단말관리', locationName: '판교 오피스', departmentName: '총무', projectName: null, mngPrimaryName: '굿모', etc: '공유 프린터', category: '주변기기' },
  { assetName: 'APC Smart-UPS 3000', groupName: '전원/냉각', taskName: '인프라', locationName: '서버 랙 R-01', departmentName: '인프라', projectName: 'IDC 안정화', mngPrimaryName: '소프트1', etc: '랙 UPS', category: '전원' },
  { assetName: 'Vertiv Liebert CRV', groupName: '전원/냉각', taskName: '인프라', locationName: 'IDC 가산 A동', departmentName: '인프라', projectName: 'IDC 안정화', mngPrimaryName: '아이티센씨티에스', etc: '항온항습', category: '전원' },
  { assetName: 'iPhone 15 Pro', groupName: '모바일', taskName: '단말관리', locationName: '역삼 오피스', departmentName: '영업', projectName: null, mngPrimaryName: null, etc: '영업 업무폰', category: '단말' },
  { assetName: 'Galaxy S24 Ultra', groupName: '모바일', taskName: '단말관리', locationName: '판교 오피스', departmentName: '영업', projectName: null, mngPrimaryName: null, etc: null, category: '단말' },
  { assetName: 'Intel Xeon Gold 6430', groupName: 'CPU', taskName: '서버관리', locationName: '서버 랙 R-02', departmentName: '인프라', projectName: '서버 증설', mngPrimaryName: null, etc: '예비 CPU', category: '부품' },
  { assetName: 'Samsung PM9A3 3.84TB', groupName: '스토리지', taskName: '스토리지', locationName: 'IDC 가산 B동', departmentName: '인프라', projectName: '스토리지 증설', mngPrimaryName: null, etc: 'NVMe SSD', category: '부품' },
  { assetName: 'Juniper EX4300', groupName: '네트워크 장비', taskName: '네트워크 관리', locationName: '역삼 오피스', departmentName: '인프라', projectName: '네트워크 개편', mngPrimaryName: '프롬소프트', etc: '층간 스위치', category: '네트워크장비' },
]

const USERS: AssetUser[] = [
  { id: 1, name: '관리자' },
  { id: 2, name: '김민수' },
  { id: 3, name: '박지훈' },
  { id: 4, name: '이영희' },
  { id: 5, name: '최수진' },
  { id: 6, name: '강준호' },
  { id: 7, name: '장미진' },
  { id: 8, name: '김도훈' },
  { id: 9, name: '윤서연' },
  { id: 10, name: '한지민' },
]

function pickUsers(seed: number, count: number): AssetUser[] {
  if (count <= 0) return []
  const start = seed % USERS.length
  return Array.from({ length: count }, (_, i) => USERS[(start + i) % USERS.length])
}

function buildContent(seeds: Asset[], targetCount: number): Asset[] {
  const rows = seeds.map((asset) => structuredClone(asset))
  let nextId = Math.max(...seeds.map((asset) => asset.id), 0) + 1

  for (let i = 0; i < EXTRA_ASSET_TEMPLATES.length && rows.length < targetCount; i++) {
    const template = EXTRA_ASSET_TEMPLATES[i]
    const seq = rows.length + 1
    const day = String((i % 28) + 1).padStart(2, '0')
    const month = String((i % 12) + 1).padStart(2, '0')
    const ipTail = 10 + (i % 200)

    rows.push({
      id: nextId++,
      assetName: template.assetName,
      assetCode: `AST_${String(1000 + seq).padStart(5, '0')}`,
      etc: template.etc,
      operator: pickUsers(i, (i % 3) + 1),
      handler: pickUsers(i + 3, (i % 4) + 1),
      createdAt: `2025-${month}-${day} 09:00:00`,
      updatedAt: `2026-${month}-${day} 14:30:00`,
      endOfService: i % 5 === 0 ? `2027-${month}-01 00:00:00` : null,
      involvedIntoCompose: i % 7 === 0,
      importDate: `2024-${month}-${day} 00:00:00`,
      importPrice: i % 3 === 0 ? String(1_000_000 * ((i % 20) + 1)) : null,
      mngPrice: i % 2 === 0 ? String(100_000 * ((i % 15) + 1)) : null,
      mngRate: i % 4 === 0 ? `${10 + (i % 10)}%` : null,
      assetCustomCodes: [
        { keyString: 1, valueString: template.category, isRemoved: false },
        { keyString: 146, valueString: `10.20.${(i % 50) + 1}.${ipTail}`, isRemoved: false },
      ],
      assetCustomStrings: [
        { keyString: 1, valueString: `부가정보-${seq}`, isRemoved: false },
        { keyString: 2, valueString: i % 2 === 0 ? 'SR팀' : '운영팀', isRemoved: false },
      ],
      groupName: template.groupName,
      taskName: template.taskName,
      locationName: template.locationName,
      slaGroupName: `${(i % 3) + 1}등급`,
      departmentName: template.departmentName,
      projectName: template.projectName,
      mngPrimaryName: template.mngPrimaryName,
      mngSecondaryName: i % 3 === 0 ? '소프트1' : null,
      mngTertiaryName: i % 5 === 0 ? '굿모' : null,
      createdByName: USERS[i % USERS.length].name,
      updatedByName: USERS[(i + 2) % USERS.length].name,
      removed: false,
    })
  }

  return rows.slice(0, targetCount).map(withFlatAttachFields) as Asset[]
}

const TOTAL_ELEMENTS = 70
const PAGE_SIZE = 40

/** API 응답 형태 더미 (content ≈ 70건) */
export const ASSET_PAGE: AssetPageResponse = {
  content: buildContent(ASSET_SEED, TOTAL_ELEMENTS),
  pageable: {
    pageNumber: 0,
    pageSize: PAGE_SIZE,
    offset: 0,
    paged: true,
    unpaged: false,
  },
  totalPages: Math.ceil(TOTAL_ELEMENTS / PAGE_SIZE),
  totalElements: TOTAL_ELEMENTS,
  last: false,
  size: PAGE_SIZE,
  number: 0,
  numberOfElements: Math.min(PAGE_SIZE, TOTAL_ELEMENTS),
  first: true,
  empty: false,
}

export const ASSET_ROWS = ASSET_PAGE.content

/** 데모용: 서버 페이징/정렬을 흉내 낸 슬라이스 (실제로는 API 응답으로 대체) */
export function fetchAssetPage(pageable: Pageable = {}): AssetPageResponse {
  const pageNumber = pageable.pageNumber ?? 0
  const size = pageable.pageSize ?? pageable.size ?? PAGE_SIZE
  const token = pageable.sort?.[0]
  let rows = [...ASSET_ROWS]

  if (token) {
    const [key, dirRaw] = String(token).split(',')
    const dir = (dirRaw ?? pageable.sortDirection ?? 'ASC').toUpperCase()
    const factor = dir === 'DESC' ? -1 : 1
    rows.sort(
      (a, b) =>
        getCellValue(a, key).localeCompare(getCellValue(b, key), 'ko', {
          numeric: true,
          sensitivity: 'base',
        }) * factor,
    )
  }

  const totalElements = rows.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const safePage = Math.min(Math.max(0, pageNumber), totalPages - 1)
  const start = safePage * size
  const content = rows.slice(start, start + size)

  return {
    content,
    pageable: {
      pageNumber: safePage,
      pageSize: size,
      offset: start,
      paged: true,
      unpaged: false,
      sort: pageable.sort,
    },
    totalPages,
    totalElements,
    last: safePage >= totalPages - 1,
    size,
    number: safePage,
    numberOfElements: content.length,
    first: safePage === 0,
    empty: content.length === 0,
  }
}
