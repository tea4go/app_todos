#!/usr/bin/env bash
set -euo pipefail

MIRROR="aliyun"
PROJECT_DIR="$(pwd)"
DO_SPEED_TEST=0
ONLY_SPEED=0
ORIG_ARGC="$#"

DO_WRITE_INIT=0
DO_PATCH_WRAPPER=0
WRITE_INIT_SET=0
PATCH_WRAPPER_SET=0
DO_SHOW_CONFIG=0

print_help() {
  cat <<'USAGE'
用法:
  ./change_gradle.sh [options]

参数:
  --mirror <aliyun|off>      选择仓库镜像(默认 aliyun)
  --project-dir <dir>        工程目录(默认当前目录)

选项:
  --write-init               写入 ~/.gradle/init.gradle
  --no-write-init            不写入 ~/.gradle/init.gradle
  --patch-wrapper            更新工程内 gradle-wrapper.properties 的 distributionUrl
  --no-patch-wrapper         不更新 gradle-wrapper.properties
  --speed                    测试 Gradle 相关地址访问速度
  --only-speed               仅测速(等价于 --no-write-init --no-patch-wrapper --speed)
  --show-config              显示当前 Gradle 配置(包括下载源)
  -h, --help                 显示帮助

示例:
  ./change_gradle.sh --mirror aliyun --project-dir ~/code/my-android-project --write-init --patch-wrapper
  ./change_gradle.sh --project-dir ~/code/my-android-project --speed
  ./change_gradle.sh --only-speed ~/code/my-android-project

兼容模式(旧用法):
  ./change_gradle.sh [mirror] [project_dir]
USAGE
}

POSITIONAL=()
while [[ "$#" -gt 0 ]]; do
  case "$1" in
    -h|--help)
      print_help
      exit 0
      ;;
    --mirror)
      if [[ "$#" -lt 2 ]]; then
        echo "--mirror 需要一个参数(aliyun/off)" >&2
        exit 2
      fi
      MIRROR="${2}"
      shift 2
      ;;
    --project-dir)
      if [[ "$#" -lt 2 ]]; then
        echo "--project-dir 需要一个目录参数" >&2
        exit 2
      fi
      PROJECT_DIR="${2}"
      shift 2
      ;;
    --write-init)
      DO_WRITE_INIT=1
      WRITE_INIT_SET=1
      shift
      ;;
    --no-write-init)
      DO_WRITE_INIT=0
      WRITE_INIT_SET=1
      shift
      ;;
    --patch-wrapper)
      DO_PATCH_WRAPPER=1
      PATCH_WRAPPER_SET=1
      shift
      ;;
    --no-patch-wrapper)
      DO_PATCH_WRAPPER=0
      PATCH_WRAPPER_SET=1
      shift
      ;;
    --speed)
      DO_SPEED_TEST=1
      shift
      ;;
    --only-speed)
      DO_SPEED_TEST=1
      ONLY_SPEED=1
      DO_WRITE_INIT=0
      DO_PATCH_WRAPPER=0
      WRITE_INIT_SET=1
      PATCH_WRAPPER_SET=1
      shift
      ;;
    --show-config)
      DO_SHOW_CONFIG=1
      shift
      ;;
    --*)
      echo "未知参数: $1" >&2
      echo "使用 -h 或 --help 查看帮助" >&2
      exit 2
      ;;
    *)
      POSITIONAL+=("$1")
      shift
      ;;
  esac
done

if [[ "${ORIG_ARGC}" -eq 0 ]]; then
  print_help
  exit 0
fi

if [[ "${ONLY_SPEED}" == "1" ]]; then
  if [[ "${#POSITIONAL[@]}" -ge 1 ]]; then
    PROJECT_DIR="${POSITIONAL[0]}"
  fi
else
  if [[ "${#POSITIONAL[@]}" -ge 1 ]]; then
    MIRROR="${POSITIONAL[0]}"
  fi
  if [[ "${#POSITIONAL[@]}" -ge 2 ]]; then
    PROJECT_DIR="${POSITIONAL[1]}"
  fi

  if [[ "${#POSITIONAL[@]}" -gt 0 && "${WRITE_INIT_SET}" == "0" && "${PATCH_WRAPPER_SET}" == "0" && "${DO_SPEED_TEST}" == "0" && "${DO_SHOW_CONFIG}" == "0" ]]; then
    DO_WRITE_INIT=1
    DO_PATCH_WRAPPER=1
  fi
fi

if [[ "${DO_WRITE_INIT}" == "0" && "${DO_PATCH_WRAPPER}" == "0" && "${DO_SPEED_TEST}" == "0" && "${DO_SHOW_CONFIG}" == "0" ]]; then
  print_help
  exit 0
fi

if [[ -z "${MIRROR}" || -z "${PROJECT_DIR}" ]]; then
  print_help >&2
  exit 2
fi

if [[ "${MIRROR}" != "aliyun" && "${MIRROR}" != "off" ]]; then
  echo "不支持的 mirror: ${MIRROR} (仅支持 aliyun/off)" >&2
  exit 2
fi

GRADLE_USER_HOME_DIR="${GRADLE_USER_HOME:-$HOME/.gradle}"
INIT_FILE="${GRADLE_USER_HOME_DIR}/init.gradle"

write_init_gradle() {
  mkdir -p "${GRADLE_USER_HOME_DIR}"

  if [[ -f "${INIT_FILE}" ]]; then
    local ts
    ts="$(date +%Y%m%d_%H%M%S)"
    cp "${INIT_FILE}" "${INIT_FILE}.bak.${ts}"
  fi

  if [[ "${MIRROR}" == "off" ]]; then
    cat > "${INIT_FILE}" <<'EOF'
allprojects {
  repositories {
    mavenCentral()
    google()
  }
}
EOF
    return 0
  fi

  cat > "${INIT_FILE}" <<'EOF'
def aliyunCentral = 'https://maven.aliyun.com/repository/central'
def aliyunPublic = 'https://maven.aliyun.com/repository/public'
def aliyunGoogle = 'https://maven.aliyun.com/repository/google'
def aliyunGradlePlugin = 'https://maven.aliyun.com/repository/gradle-plugin'

settingsEvaluated { settings ->
  settings.pluginManagement {
    repositories {
      maven { url aliyunGradlePlugin }
      maven { url aliyunGoogle }
      maven { url aliyunCentral }
      maven { url aliyunPublic }
      gradlePluginPortal()
      mavenCentral()
      google()
    }
  }
}

gradle.beforeProject { p ->
  p.buildscript.repositories {
    maven { url aliyunGradlePlugin }
    maven { url aliyunGoogle }
    maven { url aliyunCentral }
    maven { url aliyunPublic }
    mavenCentral()
    google()
    gradlePluginPortal()
  }

  p.repositories {
    maven { url aliyunGoogle }
    maven { url aliyunCentral }
    maven { url aliyunPublic }
    mavenCentral()
    google()
  }
}
EOF
}

patch_gradle_wrapper() {
  local dir="${PROJECT_DIR}"
  if [[ ! -d "${dir}" ]]; then
    echo "project_dir 不存在: ${dir}" >&2
    return 2
  fi

  local files=()
  while IFS= read -r -d '' f; do
    files+=("${f}")
  done < <(find "${dir}" -type f -path "*/gradle/wrapper/gradle-wrapper.properties" -print0 2>/dev/null || true)

  if [[ "${#files[@]}" -eq 0 ]]; then
    echo "未找到 gradle-wrapper.properties，跳过"
    return 0
  fi

  local f
  for f in "${files[@]}"; do
    local ts
    ts="$(date +%Y%m%d_%H%M%S)"
    cp "${f}" "${f}.bak.${ts}"

    perl -0777 -i -pe "s#https\\\\://services\\.gradle\\.org/distributions/#https\\\\://mirrors\\.cloud\\.tencent\\.com/gradle/#g; s#https://services\\.gradle\\.org/distributions/#https://mirrors\\.cloud\\.tencent\\.com/gradle/#g" "${f}"
    echo "已更新: ${f}"
  done
}

speed_test() {
  if ! command -v curl >/dev/null 2>&1; then
    echo "未找到 curl，无法测速" >&2
    return 2
  fi

  local urls=()
  local dir="${PROJECT_DIR}"

  local wrapper_files=()
  while IFS= read -r -d '' f; do
    wrapper_files+=("${f}")
  done < <(find "${dir}" -type f -path "*/gradle/wrapper/gradle-wrapper.properties" -print0 2>/dev/null || true)

  local wrapper_url=""
  if [[ "${#wrapper_files[@]}" -gt 0 ]]; then
    local raw
    raw="$(perl -ne 'print $1 if /^\s*distributionUrl\s*=\s*(.+?)\s*$/' "${wrapper_files[0]}" | head -n 1 || true)"
    if [[ -n "${raw}" ]]; then
      wrapper_url="${raw//\\:/\:}"
    fi
  fi

  local gradle_version="8.14.3"
  if [[ -n "${wrapper_url}" ]]; then
    local v
    v="$(sed -nE 's#.*gradle-([^/]+)-(bin|all)\.zip.*#\\1#p' <<<"${wrapper_url}" | head -n 1 || true)"
    if [[ -n "${v}" ]]; then
      gradle_version="${v}"
    fi
  fi

  if [[ -n "${wrapper_url}" ]]; then
    local url_services
    local url_tencent
    url_services="$(perl -pe 's#https://mirrors\.cloud\.tencent\.com/gradle/#https://services.gradle.org/distributions/#g' <<<"${wrapper_url}")"
    url_tencent="$(perl -pe 's#https://services\.gradle\.org/distributions/#https://mirrors.cloud.tencent.com/gradle/#g' <<<"${wrapper_url}")"
    urls+=("${url_services}")
    urls+=("${url_tencent}")
  else
    urls+=("https://services.gradle.org/distributions/gradle-${gradle_version}-bin.zip")
    urls+=("https://mirrors.cloud.tencent.com/gradle/gradle-${gradle_version}-bin.zip")
  fi

  urls+=("https://plugins.gradle.org/m2/")
  urls+=("https://maven.aliyun.com/repository/public/junit/junit/4.13.2/junit-4.13.2.pom")
  urls+=("https://repo1.maven.org/maven2/junit/junit/4.13.2/junit-4.13.2.pom")
  urls+=("https://dl.google.com/dl/android/maven2/androidx/core/core/maven-metadata.xml")

  local -A seen=()
  local uniq=()
  local u
  for u in "${urls[@]}"; do
    if [[ -z "${seen[${u}]+x}" ]]; then
      seen["${u}"]=1
      uniq+=("${u}")
    fi
  done

  printf "%-60s %6s %8s %8s %8s %10s %12s\n" "URL" "CODE" "DNS(ms)" "TCP(ms)" "TTFB(ms)" "TOTAL(ms)" "SPEED(KB/s)"

  local out code dns connect ttfb total speed
  for u in "${uniq[@]}"; do
    local range="0-32767"
    if [[ "${u}" == *".zip"* ]]; then
      range="0-262143"
    fi
    out="$(curl -L --connect-timeout 5 --max-time 20 --range "${range}" -o /dev/null -s -w "%{http_code} %{time_namelookup} %{time_connect} %{time_starttransfer} %{time_total} %{speed_download}" "${u}" || true)"
    code="$(awk '{print $1}' <<<"${out}")"
    dns="$(awk '{print $2}' <<<"${out}")"
    connect="$(awk '{print $3}' <<<"${out}")"
    ttfb="$(awk '{print $4}' <<<"${out}")"
    total="$(awk '{print $5}' <<<"${out}")"
    speed="$(awk '{print $6}' <<<"${out}")"
    dns="$(awk -v t="${dns:-0}" 'BEGIN{printf "%.0f", t*1000}')"
    connect="$(awk -v t="${connect:-0}" 'BEGIN{printf "%.0f", t*1000}')"
    ttfb="$(awk -v t="${ttfb:-0}" 'BEGIN{printf "%.0f", t*1000}')"
    total="$(awk -v t="${total:-0}" 'BEGIN{printf "%.0f", t*1000}')"
    speed="$(awk -v s="${speed:-0}" 'BEGIN{printf "%.0f", s/1024}')"
    printf "%-60s %6s %8s %8s %8s %10s %12s\n" "${u:0:60}" "${code:-ERR}" "${dns}" "${connect}" "${ttfb}" "${total}" "${speed}"
  done
}

show_config() {
  echo "=========================================="
  echo "当前 Gradle 配置"
  echo "=========================================="
  echo ""

  echo "1. 全局配置文件: ${INIT_FILE}"
  if [[ -f "${INIT_FILE}" ]]; then
    echo "   状态: 存在"
    echo ""
    echo "   内容:"
    echo "   ----------------------------------------"
    cat "${INIT_FILE}" | sed 's/^/   /'
    echo "   ----------------------------------------"
  else
    echo "   状态: 不存在"
  fi
  echo ""

  echo "2. 项目配置: ${PROJECT_DIR}"
  local wrapper_props="${PROJECT_DIR}/gradle/wrapper/gradle-wrapper.properties"
  if [[ -f "${wrapper_props}" ]]; then
    echo "   gradle-wrapper.properties: 存在"
    echo ""
    local dist_url
    dist_url="$(grep '^distributionUrl=' "${wrapper_props}" | cut -d= -f2- || echo "未找到")"
    echo "   distributionUrl: ${dist_url}"
  else
    echo "   gradle-wrapper.properties: 不存在"
  fi
  echo ""

  echo "3. 当前镜像设置: ${MIRROR}"
  echo ""

  if [[ "${MIRROR}" == "aliyun" ]]; then
    echo "4. 阿里云镜像地址:"
    echo "   Maven: https://maven.aliyun.com/repository/public"
    echo "   Google: https://maven.aliyun.com/repository/google"
    echo "   Gradle Plugin: https://maven.aliyun.com/repository/gradle-plugin"
    echo "   Gradle 发行版: https://mirrors.aliyun.com/macports/distfiles/gradle/"
  else
    echo "4. 使用官方源 (无镜像)"
  fi
  echo ""
  echo "=========================================="
}

if [[ "${DO_WRITE_INIT}" == "1" ]]; then
  write_init_gradle
  echo "已写入: ${INIT_FILE}"
fi

if [[ "${DO_PATCH_WRAPPER}" == "1" ]]; then
  patch_gradle_wrapper
fi

if [[ "${DO_SPEED_TEST}" == "1" ]]; then
  speed_test
fi

if [[ "${DO_SHOW_CONFIG}" == "1" ]]; then
  show_config
fi
