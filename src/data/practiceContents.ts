/**
 * 연습 카테고리 및 레슨 콘텐츠 데이터 (TypeScript)
 */
import { PracticeCategory } from '../types';

export const PRACTICE_CATEGORIES: PracticeCategory[] = [
  {
    id: 'position',
    name: '자리 연습',
    icon: 'Grid3x3',
    items: [
      { id: 'pos-home-ko', title: '한글 기본 자리 (ㅁㄴㅇㄹ ㅓㅏㅣ;)', desc: '기본 홈열 자리', text: 'ㅁㄴㅇㄹ ㅓㅏㅣ; ㅁㄴㅇㄹ ㅓㅏㅣ; ㅁㄴㅇㄹ ㅓㅏㅣ;' },
      { id: 'pos-home-en', title: '영문 기본 자리 (asdf jkl;)', desc: '영문 홈열 자리', text: 'asdf jkl; asdf jkl; asdf jkl; asdf jkl;' },
      { id: 'pos-top-ko', title: '한글 윗자리 (ㅂㅈㄷㄱㅅ ㅛㅕㅑㅐㅔ)', desc: '한글 상단열 자리', text: 'ㅂㅈㄷㄱㅅ ㅛㅕㅑㅐㅔ ㅂㅈㄷㄱㅅ ㅛㅕㅑㅐㅔ' },
      { id: 'pos-top-en', title: '영문 윗자리 (qwerty uiop)', desc: '영문 상단열 자리', text: 'qwerty uiop qwerty uiop qwerty uiop' },
      { id: 'pos-bottom-ko', title: '한글 아랫자리 (ㅋㅌㅊㅍ ㅠㅜㅡ)', desc: '한글 하단열 자리', text: 'ㅋㅌㅊㅍ ㅠㅜㅡ ㅋㅌㅊㅍ ㅠㅜㅡ' },
      { id: 'pos-bottom-en', title: '영문 아랫자리 (zxcv bnm,.)', desc: '영문 하단열 자리', text: 'zxcv bnm,. zxcv bnm,. zxcv bnm,.' },
      { id: 'pos-number', title: '숫자 및 기호 (12345 67890)', desc: '숫자열 자리', text: '12345 67890 !@#$% ^&*() 12345 67890' }
    ]
  },
  {
    id: 'words',
    name: '낱말 연습',
    icon: 'Type',
    items: [
      { id: 'word-ko-basic', title: '한글 기초 단어', desc: '자주 쓰이는 우리말 단어', text: '바다 하늘 구름 햇살 나무 컴퓨터 바람 소리 음악 사랑 마음 행복 미소 선물 친구 지혜' },
      { id: 'word-en-basic', title: '영문 기초 단어', desc: '자주 쓰이는 필수 영단어', text: 'apple breeze clean dream eagle focus grace honey index jump light magic night ocean peace quick' },
      { id: 'word-tech', title: 'IT & 개발 단어', desc: '개발자 필수 어휘', text: 'react javascript python system module function variable async await import export deploy server client' }
    ]
  },
  {
    id: 'metro',
    name: '지하철 역명 테마 (Metro)',
    icon: 'Train',
    items: [
      { id: 'metro-line2', title: '서울 2호선 순환선', desc: '2호선 주요 역명', text: '시청 을지로입구 동대문역사문화공원 왕십리 건대입구 잠실 삼성 강남 교대 사당 신림 신도림 홍대입구' },
      { id: 'metro-line1', title: '수도권 1호선 주요역', desc: '1호선 주요 역명', text: '청량리 종로3가 시청 서울역 용산 노량진 영등포 신도림 구로 부천 부평 인천 수원 천안' },
      { id: 'metro-shinbundang', title: '신분당선 하이라이트', desc: '신분당선 주요 역명', text: '신사 논현 신논현 강남 양재 판교 정자 미금 수지구청 광교' }
    ]
  },
  {
    id: 'sentences',
    name: '짧은 글 & 명언',
    icon: 'BookOpen',
    items: [
      { id: 'sen-hunmin', title: '훈민정음 언해본 서문', desc: '세종대왕 훈민정음', text: '나랏말싸미 듕귁에 달아 문자와로 서르 사맛디 아니할쌔 이런 젼차로 어린 백셩이 니르고져 홇 배 이셔도 마참내 제 뜻을 시러 펴디 못핧 노미 하니라.' },
      { id: 'sen-seosi', title: '윤동주 - 서시', desc: '윤동주 시인 명작', text: '죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를, 잎새에 이는 바람에도 나는 괴로워했다. 별을 노래하는 마음으로 모든 죽어가는 것을 사랑해야지.' },
      { id: 'sen-steve-jobs', title: 'Steve Jobs - Stay Hungry', desc: '스티브 잡스 명언', text: 'Your time is limited, so do not waste it living someone else life. Stay hungry, stay foolish.' },
      { id: 'sen-einstein', title: 'Albert Einstein', desc: '아인슈타인 명언', text: 'Imagination is more important than knowledge. Knowledge is limited, whereas imagination embraces the entire world.' }
    ]
  },
  {
    id: 'code',
    name: '개발자 코드 연습',
    icon: 'Code2',
    items: [
      { id: 'code-react', title: 'React Hooks Code', desc: 'React 함수형 컴포넌트', text: 'const [count, setCount] = useState(0); useEffect(() => { console.log(count); }, [count]);' },
      { id: 'code-js-async', title: 'JavaScript Async/Await', desc: '비동기 통신 코드', text: 'async function fetchData(url) { const res = await fetch(url); return await res.json(); }' }
    ]
  }
];
