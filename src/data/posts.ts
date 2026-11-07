/**
 * 企业日志。内容全部来自这次建站里真实做过的技术决策，
 * 不写客户、不写奖项、不写"赋能"。
 */
export interface PostBlock {
  /** 小节标题，同时作为右侧目录的条目 */
  h: string;
  p: string;
}

export interface PostCopy {
  title: string;
  excerpt: string;
  /** 题记：正文标题下的一行 */
  epigraph: string;
  body: PostBlock[];
}

export interface Post {
  slug: string;
  date: string;
  tag: { zh: string; en: string; yue: string; ja: string };
  readMinutes: number;
  zh: PostCopy;
  en: PostCopy;
  yue: PostCopy;
  ja: PostCopy;
}

export const posts: Post[] = [
  {
    slug: 'split-chinese-font',
    date: '2026-11-06',
    tag: { zh: '前端', en: 'Frontend', yue: '前端', ja: 'フロントエンド' },
    readMinutes: 3,
    zh: {
      title: '中文字体拆成两份，首屏快了 0.6 秒',
      excerpt: '完整 Noto Sans SC 约 10 MB。我们只留页面真正用到的 984 个字，再按首屏 / 其余拆成两份。',
      epigraph: '今天要用的字先上车，剩下的晚点到。',
      body: [
        { h: '一半的坑在字体上', p: '中文站的性能坑，一半在字体上。Noto Sans SC 的可变字体源文件 30 MB 左右，全量 woff2 也有 10 MB。没人会把整包挂上页面——问题在于子集化做完，剩下的还是一条大文件。' },
        { h: '拆成两份', p: '所以我们拆成两份。首屏那份只放站名、导航、H1、副标题和按钮文案：261 个字符、70.7 KB，用 preload 打在 head 里，跟着 HTML 一起下来。全站那份把 src 下的中文扫一遍，984 个字符，343 KB，页面真的渲染到那些字才下载。' },
        { h: 'unicode-range 必须互补', p: '两份都得带 unicode-range，而且范围要互补。少了这一步，浏览器会拿第一份去匹配，匹配不到就退到系统字体，同一行字一半 Noto、一半微软雅黑，字重和字宽全对不上。' },
        { h: '子集是脚本，不是一次性的活', p: '子集也不是一次性的活。改一句文案，「再发一条」的「条」就可能不在集合里。所以字体在这个项目里是一个脚本：扫源码，取字符集，pyftsubset，生成 @font-face，最后校验有没有缺字。改完文案跑一遍，3 秒。' },
        { h: '结果', p: '4G 限速下：FCP 0.81 秒，LCP 1.41 秒。中文字体总共 414 KB，卡在首屏的只有 70.7 KB。' },
      ],
    },
    en: {
      title: 'Two font files instead of one, and 0.6s off first paint',
      excerpt: 'A full Noto Sans SC runs about 10 MB. We keep the 984 characters this site actually uses and split them across two files.',
      epigraph: 'Ship the words you need now. The rest can take a later train.',
      body: [
        { h: 'Half the trap is fonts', p: 'On a Chinese site, fonts are where performance goes to die. The variable source is 30 MB, a full woff2 still lands around 10 MB. Nobody ships that. The trap is that a subsetted font is usually still one big file.' },
        { h: 'Split into two files', p: 'So we split it in two. The first-screen file holds only the site name, the nav, the H1, the subtitle and the button labels: 261 characters, 70.7 KB, preloaded from the head so it arrives with the HTML. The full file scans every Chinese string under src, comes to 984 characters and 343 KB, and only downloads when a page actually renders one of them.' },
        { h: 'Complementary ranges', p: 'Both files need unicode-range, and the ranges have to be complementary. Skip that and the browser matches against the first file, misses, falls back to a system font: half the line in Noto, half in Microsoft YaHei, weights and widths visibly disagreeing.' },
        { h: 'Subsetting is a script', p: 'Subsetting is not a one-off. Change a line of copy and a word can drop out. So the font is a script in this repo: scan the source, collect characters, pyftsubset, emit @font-face, then verify nothing is missing. Three seconds after a copy edit.' },
        { h: 'The result', p: 'On 4G throttling: FCP 0.81s, LCP 1.41s, 414 KB of Chinese font in total, and only 70.7 KB blocking first paint.' },
      ],
    },
    yue: {
      title: '中文字體拆成兩份，首屏快咗 0.6 秒',
      excerpt: '完整 Noto Sans SC 大約 10 MB。我哋只留低頁面真係用到嘅 984 個字，再按首屏 / 其餘拆成兩份。',
      epigraph: '今日要用嘅字上車先，其餘遲啲到。',
      body: [
        { h: '一半嘅坑喺字體度', p: '中文站嘅效能坑，一半喺字體度。Noto Sans SC 嘅可變字體源文件 30 MB 左右，全量 woff2 都有 10 MB。冇人會將成包掛上頁面——問題在於子集化做完，剩返嘅仲係一條大檔案。' },
        { h: '拆成兩份', p: '所以我哋拆成兩份。首屏嗰份只放站名、導航、H1、副標題同按鈕文案：261 個字元、70.7 KB，用 preload 打喺 head 度，跟住 HTML 一齊落嚟。全站嗰份將 src 下面嘅中文掃一次，984 個字元，343 KB，頁面真係渲染到嗰啲字先下載。' },
        { h: 'unicode-range 一定要互補', p: '兩份都要帶 unicode-range，而且範圍要互補。少咗呢一步，瀏覽器會攞第一份去匹配，對唔到就跌落系統字體，同一行字一半 Noto、一半微軟雅黑，字重同字寬全部對唔上。' },
        { h: '子集係腳本，唔係做一次就算', p: '子集都唔係一次性嘅嘢。改一句文案，「再發一條」嘅「條」就可能唔喺集合入面。所以字體喺呢個項目入面係一個腳本：掃源碼，攞字元集，pyftsubset，生成 @font-face，最後驗下有冇缺字。改完文案跑一次，3 秒。' },
        { h: '結果', p: '4G 限速下：FCP 0.81 秒，LCP 1.41 秒。中文字體總共 414 KB，卡喺首屏嘅只有 70.7 KB。' },
      ],
    },
    ja: {
      title: '中国語フォントを二つに割ったら、初回表示が 0.6 秒速くなった',
      excerpt: 'Noto Sans SC のフルセットは約 10 MB。実際に使う 984 文字だけを残し、初回表示用とそれ以外に分割しました。',
      epigraph: '今日使う文字だけ先に積む。残りは後便でいい。',
      body: [
        { h: '半分の落とし穴はフォント', p: '中国語サイトのパフォーマンス問題は、半分がフォントです。Noto Sans SC の可変フォントは約 30 MB、woff2 のフルセットでも 10 MB 級。誰もそのままは載せません。問題は、サブセット化しても「大きなファイル一つ」のままになりがちなことです。' },
        { h: '二つに割る', p: 'そこで二つに分けました。初回表示用はサイト名、ナビ、H1、サブタイトル、ボタン文言だけで 261 文字、70.7 KB。head から preload して HTML と一緒に降ります。全体用は src 配下の中国語を走査して 984 文字、343 KB。その文字が実際に描画された時だけダウンロードされます。' },
        { h: 'unicode-range は必ず補完関係に', p: 'どちらにも unicode-range が必要で、範囲は互いに補完していなければなりません。これを省くと、ブラウザは一つ目のファイルで照合し、外れた時点でシステムフォントに落ちます。同じ行の半分が Noto、半分が別の書体になり、ウェイトも字幅も揃いません。' },
        { h: 'サブセットはスクリプトである', p: 'サブセットは一度きりの作業ではありません。文言を一行変えるだけで、新しい語の文字が集合から外れます。だからこのプロジェクトではフォントはスクリプトです。ソースを走査し、文字集合を取り、pyftsubset をかけ、@font-face を生成し、欠けがないか検証する。文言変更の 3 秒後に走ります。' },
        { h: '結果', p: '4G 制限下で FCP 0.81 秒、LCP 1.41 秒。中国語フォントは合計 414 KB で、初回表示を妨げるのは 70.7 KB だけです。' },
      ],
    },
  },
  {
    slug: 'globe-texture-from-tianditu',
    date: '2026-11-05',
    tag: { zh: '图形', en: 'Graphics', yue: '圖形', ja: 'グラフィックス' },
    readMinutes: 4,
    zh: {
      title: '256 张瓦片，烘成一张地球',
      excerpt: '没买贴图，也没用 NASA 的公共域图：直接抓天地图的 img_w 瓦片，重投影成等距圆柱贴图。',
      epigraph: '一张地球，是 256 张照片商量好把接缝藏起来。',
      body: [
        { h: '那条从轨道落到门牌的转场', p: '首页往下第八屏有个转场：带卫星影像的球体从轨道转到中国，镜头推近，再淡出交给天地图的 2D 卫星地图。球体要一张等距圆柱（equirectangular）贴图。' },
        { h: '为什么不买一张', p: '现成的路有两条：买，或者用 NASA 的公共域图。买不便宜；NASA 那张和下面的天地图不是同一套影像，云量、色调、海岸线都对不上，一切到地图就露馅。' },
        { h: '抓瓦片，再重投影', p: '于是直接抓天地图。z=4 正好 256 张 img_w 瓦片，拼成 4096×4096 的墨卡托底图，numpy 做一次双线性重投影，把墨卡托的 y 映射成纬度，输出 2048×1024 的 WebP，161 KB。' },
        { h: '两个坑', p: '两个坑。一是 UA：服务端用默认 UA 请求，天地图直接回 403「Key权限类型为:浏览器端」，换成 Chrome UA 就通了——Referer 反而不查。二是经度原点：我们把 x=W/2 定在东经 113.5575°，也就是韶关，球体一开始就朝着中国，省掉半圈空转。' },
        { h: '清晰度是有边界的', p: '清晰度得说实话：2048 在赤道只有 5.7 像素/度，韶关市区在图上占 6 个像素。所以镜头只推到省一级，再近交给真正的瓦片地图。用转场盖住分辨率不够，比堆一张 8192 的贴图划算。' },
      ],
    },
    en: {
      title: '256 tiles, one globe',
      excerpt: 'No bought texture, no public-domain NASA imagery. We pulled Tianditu img_w tiles and reprojected them into an equirectangular map.',
      epigraph: 'A globe is 256 photographs agreeing to hide the seams.',
      body: [
        { h: 'The transition from orbit', p: 'Section eight of the home page is a transition from orbit to a door number: a satellite-textured globe turns to China, the camera pushes in, then it cross-fades to the 2D Tianditu satellite map. The globe needs an equirectangular texture.' },
        { h: 'Why not buy a texture', p: 'Two obvious routes: buy one, or use public-domain NASA imagery. The first is not cheap. The second is not the same imagery as the map underneath — cloud cover, tone and coastline all disagree, and the cross-fade gives it away.' },
        { h: 'Pull tiles, then reproject', p: 'So we pulled Tianditu tiles directly. At z=4 that is 256 img_w tiles, stitched into a 4096×4096 Mercator image, then one bilinear reprojection in numpy mapping Mercator y to latitude, written out as a 2048×1024 WebP at 161 KB.' },
        { h: 'Two traps', p: 'Two traps. The tile endpoint checks the user agent: a server-side request with a default UA returns 403, this key is browser-side; a Chrome UA goes through, and the referrer turned out not to matter. The other is the longitude origin: we defined x=W/2 as 113.5575°E, Shaoguan, so the globe already faces China and half a rotation disappears.' },
        { h: 'Sharpness has a limit', p: 'As for sharpness, let us be honest. 2048 gives about 5.7 pixels per degree at the equator; the whole city of Shaoguan covers six pixels. So the camera stops at province level and the real tile map takes over. Hiding that limit inside a transition beats paying for an 8192-pixel texture.' },
      ],
    },
    yue: {
      title: '256 塊瓦片，烘成一張地球',
      excerpt: '冇買貼圖，都冇用 NASA 嘅公共領域圖：直接抓天地圖嘅 img_w 瓦片，重投影成等距圓柱貼圖。',
      epigraph: '一張地球，係 256 張相講好咗將接縫收埋。',
      body: [
        { h: '由軌道跌落門牌嗰個轉場', p: '首頁向下第八屏有個轉場：帶衛星影像嘅球體由軌道轉向中國，鏡頭推近，再淡出交俾天地圖嘅 2D 衛星地圖。球體要一張等距圓柱（equirectangular）貼圖。' },
        { h: '為咩唔買一張', p: '現成嘅路有兩條：買，或者用 NASA 嘅公共領域圖。買唔平；NASA 嗰張同下面嘅天地圖唔係同一套影像，雲量、色調、海岸線全部對唔上，一轉到地圖就穿崩。' },
        { h: '抓瓦片，再重投影', p: '所以直接抓天地圖。z=4 啱啱好 256 張 img_w 瓦片，砌成 4096×4096 嘅墨卡托底圖，numpy 做一次雙線性重投影，將墨卡托嘅 y 映射成緯度，輸出 2048×1024 嘅 WebP，161 KB。' },
        { h: '兩個坑', p: '兩個坑。一係 UA：伺服器用預設 UA 去請求，天地圖直接回 403「Key權限類型為:瀏覽器端」，換成 Chrome UA 就通——Referer 反而唔查。二係經度原點：我哋將 x=W/2 定喺東經 113.5575°，即係韶關，球體一開始就對住中國，慳返半圈空轉。' },
        { h: '清晰度有邊界', p: '清晰度要講實話：2048 喺赤道只有 5.7 像素/度，韶關市區喺幅圖上面佔 6 個像素。所以鏡頭只推到省一級，再近就交俾真正嘅瓦片地圖。用轉場遮住解像度唔夠，比砌一張 8192 嘅貼圖划算。' },
      ],
    },
    ja: {
      title: '256 枚のタイルを、一つの地球に焼く',
      excerpt: 'テクスチャは買わず、公開の NASA 画像も使わず。天地図の img_w タイルを取得して正距円筒図法に再投影しました。',
      epigraph: '地球とは、256 枚の写真が継ぎ目を隠すことに合意した結果だ。',
      body: [
        { h: '軌道から番地へ落ちる場面', p: 'ホームの 8 画面目に切り替えがあります。衛星画像を貼った球体が軌道から中国へ向き、カメラが寄り、そして天地図の 2D 衛星地図へクロスフェードします。球体には正距円筒図法のテクスチャが必要です。' },
        { h: 'なぜ買わないのか', p: '選択肢は二つ。買うか、パブリックドメインの NASA 画像を使うか。買うのは安くありません。NASA の画像は下の天地図と映像が揃わず、雲量も色調も海岸線も食い違うので、地図に切り替わる瞬間に破綻します。' },
        { h: 'タイルを取得して再投影', p: 'そこで天地図のタイルを直接取得しました。z=4 で 256 枚、4096×4096 のメルカトル図に繋ぎ、numpy で一度だけ双線形再投影してメルカトルの y を緯度に写像し、2048×1024 の WebP、161 KB として出力します。' },
        { h: '二つの落とし穴', p: '一つは UA。サーバー側の既定 UA では天地図が 403 を返します。「Key の種類がブラウザ向け」という意味です。Chrome の UA にすると通り、Referer はむしろ要求されません。もう一つは経度の原点。x=W/2 を東経 113.5575°、つまり韶関と定義したので、最初から中国を向いており、半回転が不要になります。' },
        { h: '解像度には限界がある', p: '正直に書きます。2048 では赤道で 1 度あたり約 5.7 ピクセル、韶関の市街地は 6 ピクセルにしかなりません。だからカメラは省レベルで止め、そこから先は本物のタイル地図に任せます。解像度の不足を切り替えで隠す方が、8192 のテクスチャを用意するより割に合います。' },
      ],
    },
  },
  {
    slug: 'mascot-pipeline',
    date: '2026-11-04',
    tag: { zh: '设计', en: 'Design', yue: '設計', ja: 'デザイン' },
    readMinutes: 3,
    zh: {
      title: '一个角色，七个姿势，一张母版',
      excerpt: '七种状态不是每次重新生成出来的，是从同一张母版派生的。',
      epigraph: '她只有一个。另外六个是她换了姿势。',
      body: [
        { h: '先有一张母版', p: '先有母版。同一段角色设定丢给模型——黑发、猫耳、奶白毛衣、橙色三角鼻，扁平暖色，统一描边——生成几个候选，挑那张最「能长」的。' },
        { h: '六张全部由图生图派生', p: '剩下六张不重新描述角色，用图生图派生：「保持角色和画风完全一致，改成正在挥手」。这样得到的才是同一个角色的七个姿势，而不是七个长得很像的角色。' },
        { h: '抠底和裁切', p: '抠底和裁切必须做。生成的原图约 1254×1254，透明边距每次都不一样，头顶那撮呆毛常常贴着画布上沿。脚本按 alpha 取包围盒，外扩 6%，导出 720 和 512 两档 WebP，主图压在 50 KB 以内。' },
        { h: '每个表情都要有地方放', p: '然后是用法。吉祥物不该是一面装饰墙。每个表情都绑一个具体场景：加载、提交成功、404、角落探头。' },
        { h: '想不出地方就不做', p: '多一个表情，就多一个能用她的地方；想不出地方的表情，不做。' },
      ],
    },
    en: {
      title: 'One character, seven poses, one master',
      excerpt: 'Seven states, not from regenerating the character each time, but from deriving everything off a single master image.',
      epigraph: 'There is only one of her. The other six are her, shifted.',
      body: [
        { h: 'One master first', p: 'The master comes first. Hand the model one character sheet — black hair, cat ears, cream sweater, an orange triangular nose, flat warm palette, consistent outline — generate a handful of candidates, and keep the one that looks like it can grow.' },
        { h: 'Everything else is derived', p: 'The rest are derived with image-to-image, never re-described: "keep the character and style identical, now she is waving." That is the difference between one character in seven poses and seven characters who happen to resemble each other.' },
        { h: 'Cutout and crop', p: 'Cutout and crop are not optional. The raw PNG is about 1254×1254, the transparent margins are inconsistent, and the ahoge on top keeps touching the canvas edge. The script takes the alpha bounding box, pads it by 6%, and exports 720 and 512 WebP variants, main image held under 50 KB.' },
        { h: 'Every expression needs a place', p: 'Then the rule for using her: a mascot is not a decoration wall. Every expression is bound to a concrete moment — loading, a successful submit, a 404, the head that peeks in at the corner.' },
        { h: 'No place, no face', p: 'One more expression means one more place she can be useful. If we cannot name the place, we do not draw the face.' },
      ],
    },
    yue: {
      title: '一個角色，七個姿勢，一張母版',
      excerpt: '七種狀態唔係每次重新生成，係由同一張母版派生。',
      epigraph: '佢只有一個。另外六個係佢換咗姿勢。',
      body: [
        { h: '先有一張母版', p: '先有母版。同一段角色設定掉俾模型——黑髮、貓耳、奶白毛衣、橙色三角鼻，扁平暖色，統一描邊——生成幾個候選，揀嗰張最「養得大」嘅。' },
        { h: '六張全部用圖生圖派生', p: '剩返六張唔重新描述角色，用圖生圖派生：「保持角色同畫風完全一致，改成正在揮手」。咁樣得到嘅先係同一個角色嘅七個姿勢，而唔係七個好似樣嘅角色。' },
        { h: '摳底同裁切', p: '摳底同裁切一定要做。生成嘅原圖大約 1254×1254，透明邊距每次都唔同，頭頂嗰撮呆毛成日貼住畫布上沿。腳本按 alpha 攞包圍盒，外擴 6%，輸出 720 同 512 兩檔 WebP，主圖壓喺 50 KB 以內。' },
        { h: '每個表情都要有位放', p: '然後係用法。吉祥物唔應該係一面裝飾牆。每個表情都綁一個具體場景：載入、提交成功、404、角落探頭。' },
        { h: '諗唔到位就唔做', p: '多一個表情，就多一個用得着佢嘅地方；諗唔到位嘅表情，唔做。' },
      ],
    },
    ja: {
      title: '一つのキャラクター、七つの姿勢、一枚のマスター',
      excerpt: '七つの状態は毎回作り直したのではなく、同一のマスター画像から派生させました。',
      epigraph: '彼女は一人だけ。残りの六人は、姿勢を変えた同じ彼女だ。',
      body: [
        { h: 'まずマスターを一枚', p: '最初にマスターを作ります。同じキャラクター設定をモデルに渡します。黒髪、猫耳、生成りのセーター、オレンジの三角の鼻、フラットで暖かい配色、統一した線。候補をいくつか出し、一番「育ちそう」な一枚を残します。' },
        { h: '残りはすべて img2img で派生', p: '残り六枚はキャラクターを再記述せず、イメージ・トゥ・イメージで派生させます。「キャラクターと画風を完全に維持し、手を振っている状態に」。これで初めて、同じキャラクターの七つの姿勢になります。似た七人ではなく。' },
        { h: '切り抜きとトリミング', p: '切り抜きとトリミングは必須です。生成される元画像は約 1254×1254 で、透過余白が毎回違い、頭頂のアホ毛がしばしばキャンバス上端に接します。スクリプトが alpha のバウンディングボックスを取り、6% 外側に広げ、720 と 512 の二種の WebP を書き出します。メイン画像は 50 KB 以内に収めます。' },
        { h: 'すべての表情に置き場所を', p: '次は使い方です。マスコットは飾りの壁であるべきではありません。どの表情にも具体的な場面を一つ割り当てます。読み込み、送信完了、404、隅からのぞく瞬間。' },
        { h: '置き場所がないなら作らない', p: '表情が一つ増えれば、彼女を置ける場所が一つ増えます。置き場所を言えない表情は作りません。' },
      ],
    },
  },
];