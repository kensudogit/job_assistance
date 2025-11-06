from setuptools import setup, find_packages

# セットアップ設定
setup(
    # プロジェクト基本情報
    name='job_assistance',
    version='0.1.0',
    description='就労支援システム',
    author='R-28',
    author_email='rr28_yosizumi@hotmail.com',
    
    # パッケージ設定
    packages=find_packages('src') or [],
    package_dir={'': 'src'},
    py_modules=['main', 'job_posting', 'application', 'matching', 'interview', 'skills', 'database'],
    
    # 依存パッケージ一覧
    install_requires=[
        'sqlalchemy',        # ORMライブラリ
        'flask',             # Webフレームワーク
        'flask-sqlalchemy',  # Flask用SQLAlchemy拡張
        'pandas',            # データ分析ライブラリ
        'python-dateutil',   # 日付処理ライブラリ
        'pyyaml',            # YAMLファイル処理ライブラリ
        'requests',          # HTTPリクエストライブラリ
    ],
    
    # Pythonバージョン要件
    python_requires='>=3.8',
    
    # コマンドライン実行用スクリプト設定
    entry_points={
        'console_scripts': [
            'job_assistance=main:main',
        ],
    },
    
    # パッケージデータを含める
    include_package_data=True,
    
    # プロジェクト分類情報
    classifiers=[
        'Programming Language :: Python :: 3',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
    ],
)

