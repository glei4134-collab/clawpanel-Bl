import { _ } from '../helper.js'

export default {
  local: _('本机', 'Local', '本機', 'ローカル', '로컬', 'Cục bộ', '', '', 'Локальный', '', 'Lokal'),
  remote: _('远程', 'Remote', '遠程', 'リモート', '원격', 'Từ xa', 'Remoto', 'Remoto', 'Удалённый', 'Distant'),
  docker: _('Docker', 'Docker'),
  switchHint: _('切换后，模型配置、Agent 等页面将管理对应实例', 'After switching, Models, Agents and other pages will manage the selected instance', '切換后，模型設定、Agent 等頁面將管理对應執行個體', '切り替え後、モデル設定や Agent などのページは選択したインスタンスを管理します', '전환 후 모델 설정, Agent 등의 페이지에서 해당 인스턴스를 관리합니다'),
  addInstance: _('添加实例', 'Add Instance', '新增執行個體', 'インスタンス追加', '인스턴스 추가', 'Thêm instance', 'Agregar instancia', 'Adicionar instância', 'Добавить экземпляр', 'Ajouter une instance', 'Instanz hinzufügen'),
  addRemote: _('添加远程实例', 'Add Remote Instance', '新增遠程執行個體', 'リモートインスタンス追加', '원격 인스턴스 추가', 'Thêm instance từ xa', 'Agregar instancia remota', 'Adicionar instância remota', 'Добавить удалённый', 'Ajouter une instance distante', 'Remote-Instanz hinzufügen'),
  namePlaceholder: _('远程服务器', 'Remote Server', '遠程伺服器', 'リモートサーバー', '원격 서버'),
  endpointPlaceholder: _('http://192.168.1.100:1420', 'http://192.168.1.100:1420'),
  nameLabel: _('名称', 'Name', '名稱', '名前', '이름', 'Tên', 'Nombre', 'Nome', 'Имя', 'Nom'),
  endpointLabel: _('面板地址', 'Panel Address', '面板位址', 'パネルアドレス', '패널 주소', 'Địa chỉ panel', 'Dirección del panel', 'Endereço do painel', 'Адрес панели', 'Adresse du panneau', 'Panel-Adresse'),
  gwPortLabel: _('Gateway 端口（可选）', 'Gateway Port (optional)', 'Gateway 連接埠（可選）', 'Gateway ポート（任意）', 'Gateway 포트 (선택)'),
  nameRequired: _('请填写名称和面板地址', 'Please fill in name and endpoint', '請填写名稱和面板位址', '名前とパネルアドレスを入力してください', '이름과 패널 주소를 입력하세요'),
  endpointExists: _('该端点已存在', 'This endpoint already exists', '該端点已存在', 'このエンドポイントは既に存在します', '이 엔드포인트는 이미 존재합니다'),
  adding: _('添加中...', 'Adding...', '新增中...', '追加中...', '추가 중...', 'Đang thêm...', 'Agregando...', 'Adicionando...', 'Добавление...', 'Ajout...', 'Wird hinzugefügt...'),
  switchedTo: _('已切换到 {name} — 模型配置、Agent 等将管理该实例', 'Switched to {name} — Models, Agents, etc. will manage this instance', '已切換到 {name} — 模型設定、Agent 等將管理該執行個體', '{name} に切り替えました', '{name}(으)로 전환됨'),
  current: _('当前', 'Active', '目前', '現在', '현재', 'Hiện tại', 'Actual', 'Atual', 'Текущий', 'Actuel', 'Aktuell'),
  remoteHint: _('远程服务器需要运行 ClawPanel (serve.js)。', 'The remote server must be running ClawPanel (serve.js).', '遠程伺服器需要執行 ClawPanel (serve.js)。', 'リモートサーバーで ClawPanel (serve.js) が実行されている必要があります。', '원격 서버에서 ClawPanel (serve.js)이 실행 중이어야 합니다.'),
  example: _('示例', 'Example', '', '例', '예시'),
}
