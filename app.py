from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for, abort
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
import json
from werkzeug.utils import secure_filename
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = Flask(__name__, template_folder='.')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///portfolio.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Email configuration (set via environment variables)
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'True').lower() in ['true', 'on', '1']
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', '')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', '')
app.config['CONTACT_EMAIL'] = os.environ.get('CONTACT_EMAIL', 'davidhoangem@gmail.com')

db = SQLAlchemy(app)

# Database Models
class BlogPost(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    excerpt = db.Column(db.Text)
    content = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(500))
    category = db.Column(db.String(100))
    tags = db.Column(db.String(500))  # Comma-separated
    published = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    views = db.Column(db.Integer, default=0)

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    description = db.Column(db.Text)
    content = db.Column(db.Text)  # Full case study
    image_url = db.Column(db.String(500))
    technologies = db.Column(db.String(500))  # Comma-separated
    github_url = db.Column(db.String(500))
    live_url = db.Column(db.String(500))
    category = db.Column(db.String(100))
    featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ContactMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(200), nullable=False)
    subject = db.Column(db.String(200))
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    read = db.Column(db.Boolean, default=False)

class NewsletterSubscriber(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(200), unique=True, nullable=False)
    subscribed_at = db.Column(db.DateTime, default=datetime.utcnow)
    active = db.Column(db.Boolean, default=True)

class Testimonial(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(100))
    company = db.Column(db.String(100))
    content = db.Column(db.Text, nullable=False)
    avatar_url = db.Column(db.String(500))
    rating = db.Column(db.Integer, default=5)
    featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


def seed_default_projects():
    """Seed default project entries used by the Work page."""
    goldenstock_slug = "goldenstock-production-stock-analytics-platform"
    goldenstock_content = """
<h2>GoldenStock là gì?</h2>
<p>
GoldenStock là dự án mình phát triển để giải quyết một nhu cầu rất thực tế: <strong>đọc nhanh, hiểu sâu và ra quyết định sớm</strong>
trên thị trường chứng khoán Việt Nam. Thay vì mở nhiều tab rời rạc (giá, báo cáo tài chính, định giá, dữ liệu vĩ mô),
mình gom toàn bộ vào một hệ thống duy nhất với trải nghiệm trực quan và nhất quán.
</p>

<p>
Mục tiêu không dừng ở việc “vẽ chart đẹp”. Mình định hướng GoldenStock như một sản phẩm có thể vận hành thật:
ổn định khi upstream chập chờn, dễ mở rộng module mới, và triển khai production gọn gàng.
</p>

<h2>Bài toán kỹ thuật cốt lõi</h2>
<p>Khi đi vào triển khai thực tế, mình gặp 3 thách thức lớn:</p>
<ol>
    <li><strong>Schema dữ liệu thiếu đồng nhất</strong> giữa các nguồn và endpoint.</li>
    <li><strong>Bảo mật token/API key</strong> để không lộ thông tin nhạy cảm ở client.</li>
    <li><strong>Độ ổn định của upstream</strong> (lỗi, timeout, rate-limit) nhưng UI vẫn phải mượt.</li>
</ol>

<p>
Giải pháp là tách kiến trúc thành 3 lớp để mỗi lớp giải quyết đúng trách nhiệm:
</p>
<ul>
    <li><strong>Frontend Next.js</strong> cho trải nghiệm người dùng và dashboard tương tác.</li>
    <li><strong>API Proxy trong Next.js</strong> để giữ token ở server-side, kiểm soát request.</li>
    <li><strong>FastAPI Bridge</strong> để tích hợp VNStock, chuẩn hóa dữ liệu, cache và fallback.</li>
</ul>

<h3>Luồng dữ liệu</h3>
<p><code>Browser → Next.js App → /api/vnstock proxy → FastAPI bridge → VNStock</code></p>

<h2>Những gì mình đã xây</h2>
<h3>1) Dashboard phân tích hợp nhất</h3>
<ul>
    <li>Giá &amp; Khối lượng</li>
    <li>Kết quả kinh doanh: Doanh thu, LNST, Biên lợi nhuận</li>
    <li>ROE / ROA / Net Margin</li>
    <li>Cơ cấu dòng tiền: Operating / Investing / Financing</li>
    <li>Định giá P/E, P/B</li>
    <li>Cổ tức &amp; trả thưởng</li>
    <li>Dòng tiền khối ngoại và tự doanh</li>
    <li>Thanh khoản và độ rộng thị trường</li>
</ul>
<p>
Ngoài biểu đồ, mình bổ sung cụm KPI ở đầu trang để người dùng nắm nhanh bức tranh tổng quan chỉ trong vài giây.
</p>

<h3>2) News &amp; Macro trong cùng màn hình</h3>
<ul>
    <li>Feed tin tức theo từng mã cổ phiếu</li>
    <li>Expand/Collapse nội dung bài viết</li>
    <li>Widget macro: USD/VND, vàng, dầu, lãi suất</li>
    <li>Tô màu tăng/giảm để đọc trạng thái thị trường tức thì</li>
</ul>

<h3>3) Stock Screener + Export báo cáo</h3>
<p>
Mình triển khai bộ lọc theo sector, khoảng P/E, khoảng RS và số lượng mã trả về. Sau khi lọc, người dùng có thể xuất Excel ngay để phục vụ phân tích offline hoặc chia sẻ nội bộ.
</p>

<h3>4) Export đa chart ra Excel</h3>
<p>
Không chỉ screener, dashboard chính cũng hỗ trợ xuất nhiều sheet theo từng chart đang bật. Mỗi sheet là một dataset độc lập để tiện truy vết lịch sử và phân tích sâu.
</p>

<h2>Các quyết định kỹ thuật quan trọng</h2>
<h3>Chuẩn hóa dữ liệu ở adapter layer</h3>
<p>
Mình dùng schema validation + mapping để gom các field alias về một cấu trúc chuẩn trước khi đẩy lên UI.
Kết quả là frontend không còn phụ thuộc vào “tính thất thường” của upstream.
</p>

<h3>Giữ toàn bộ token ở server-side</h3>
<p>
Client không gọi trực tiếp API nhạy cảm. Mọi request đi qua proxy/bridge giúp giảm rủi ro lộ key,
đồng thời dễ log, retry và kiểm soát lỗi theo chuẩn nội bộ.
</p>

<h3>Ưu tiên trải nghiệm ngay cả khi lỗi</h3>
<p>
Thay vì để dashboard trắng khi upstream lỗi, hệ thống trả <strong>synthetic fallback data</strong> kèm badge trạng thái <strong>LIVE/FALLBACK</strong> theo từng nhóm dữ liệu.
Người dùng vẫn thao tác bình thường trong khi đội kỹ thuật có thời gian xử lý phía sau.
</p>

<h2>Kết quả đạt được</h2>
<ul>
    <li>Hoàn thiện full flow từ UI đến data bridge</li>
    <li>Dashboard vận hành ổn định với nhiều nhóm dữ liệu tài chính</li>
    <li>Xuất dữ liệu Excel phục vụ phân tích offline</li>
    <li>Dockerize để sẵn sàng triển khai production</li>
    <li>Kiến trúc mở cho watchlist, alert, backtest trong các phase kế tiếp</li>
</ul>

<h2>Bài học rút ra</h2>
<ol>
    <li><strong>Thiết kế kiến trúc dữ liệu thực chiến</strong> luôn quan trọng hơn demo đẹp.</li>
    <li><strong>Khả năng chịu lỗi</strong> là tiêu chuẩn bắt buộc với sản phẩm tài chính.</li>
    <li><strong>Tư duy sản phẩm</strong> phải ưu tiên tốc độ đọc, độ tin cậy và hành vi người dùng.</li>
</ol>

<h2>Định hướng tiếp theo</h2>
<ul>
    <li>Watchlist và cảnh báo realtime</li>
    <li>So sánh nhiều mã cùng lúc</li>
    <li>Backtest chiến lược cơ bản</li>
    <li>CI/CD + observability cho production</li>
</ul>

<hr />
<p>
<strong>Trải nghiệm GoldenStock:</strong>
<a href="https://golden-stock.vercel.app/" target="_blank" rel="noopener">https://golden-stock.vercel.app/</a>
</p>
<p>
Nếu bạn muốn, mình có thể chia sẻ thêm về cấu trúc adapter, chiến lược cache/fallback và checklist production mình đang dùng cho dự án này.
</p>
""".strip()

    default_project = {
        "title": "GoldenStock — Từ dashboard đẹp đến nền tảng phân tích chứng khoán sẵn sàng production",
        "description": "Case study về cách mình xây GoldenStock: chuẩn hóa dữ liệu, bảo vệ token server-side, chịu lỗi tốt với fallback, và tối ưu trải nghiệm phân tích cho nhà đầu tư.",
        "content": goldenstock_content,
        "image_url": "/static/assets/goldenstockblog.png",
        "technologies": "Next.js 16, React 19, TypeScript, Tailwind CSS, Highcharts, FastAPI, Python, VNStock, ExcelJS, Docker",
        "github_url": "",
        "live_url": "https://golden-stock.vercel.app/",
        "category": "Fintech",
        "featured": True,
    }

    project = Project.query.filter_by(slug=goldenstock_slug).first()
    if project:
        for key, value in default_project.items():
            setattr(project, key, value)
    else:
        project = Project(slug=goldenstock_slug, **default_project)
        db.session.add(project)

    db.session.commit()

# Create tables
with app.app_context():
    db.create_all()
    seed_default_projects()

# Template context processor
@app.context_processor
def inject_current_year():
    return dict(current_year=datetime.now().year)

# Routes
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/cv")
def cv():
    return render_template("cv.html")

@app.route("/blog")
def blog():
    page = request.args.get('page', 1, type=int)
    per_page = 6
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    
    query = BlogPost.query.filter_by(published=True)
    
    if search:
        query = query.filter(
            db.or_(
                BlogPost.title.contains(search),
                BlogPost.content.contains(search),
                BlogPost.excerpt.contains(search)
            )
        )
    
    if category:
        query = query.filter_by(category=category)
    
    posts = query.order_by(BlogPost.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    categories = db.session.query(BlogPost.category).filter_by(published=True).distinct().all()
    categories = [c[0] for c in categories if c[0]]
    
    return render_template("templates/blog.html", posts=posts, categories=categories, search=search, current_category=category)

@app.route("/blog/<slug>")
def blog_post(slug):
    post = BlogPost.query.filter_by(slug=slug, published=True).first_or_404()
    post.views += 1
    db.session.commit()
    
    # Get related posts
    related = BlogPost.query.filter(
        BlogPost.id != post.id,
        BlogPost.published == True,
        db.or_(
            BlogPost.category == post.category,
            BlogPost.tags.contains(post.tags.split(',')[0] if post.tags else '')
        )
    ).limit(3).all()
    
    return render_template("templates/blog_post.html", post=post, related=related)

@app.route("/work")
def work():
    category = request.args.get('category', '')
    query = Project.query
    if category:
        query = query.filter(Project.technologies.contains(category))
    
    projects = query.order_by(Project.created_at.desc()).all()
    technologies = set()
    for project in projects:
        if project.technologies:
            technologies.update([t.strip() for t in project.technologies.split(',')])
    
    return render_template("templates/work.html", projects=projects, technologies=sorted(technologies), current_category=category)

@app.route("/work/<slug>")
def project(slug):
    project = Project.query.filter_by(slug=slug).first_or_404()
    return render_template("templates/project.html", project=project)

@app.route("/contact", methods=["POST"])
def contact():
    """
    Accept both JSON (AJAX) and traditional form submissions.
    """
    data = {}
    if request.is_json:
        data = request.get_json(silent=True) or {}
    else:
        # Fallback to form data
        data = {
            'name': request.form.get('name', '').strip(),
            'email': request.form.get('email', '').strip(),
            'subject': request.form.get('subject', '').strip(),
            'message': request.form.get('message', '').strip(),
        }
    
    # Basic validation
    if not data.get('name') or not data.get('email') or not data.get('message'):
        if request.is_json:
            return jsonify({'success': False, 'message': 'Please fill in all required fields.'}), 400
        # Form fallback response
        return redirect(url_for('home') + '#contact')
    
    # Save to database
    message = ContactMessage(
        name=data['name'],
        email=data['email'],
        subject=data.get('subject', ''),
        message=data['message']
    )
    db.session.add(message)
    db.session.commit()
    
    # Send email notification (best-effort)
    try:
        send_contact_email(message)
    except Exception as e:
        print(f"Email sending failed: {e}")
    
    if request.is_json:
        return jsonify({'success': True, 'message': 'Thank you! Your message has been sent.'})
    # Redirect back to contact section on success for non-AJAX
    return redirect(url_for('home') + '#contact')

@app.route("/newsletter", methods=["POST"])
def newsletter():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    
    if not email or '@' not in email:
        return jsonify({'success': False, 'message': 'Please enter a valid email address.'}), 400
    
    # Check if already subscribed
    existing = NewsletterSubscriber.query.filter_by(email=email).first()
    if existing:
        if existing.active:
            return jsonify({'success': False, 'message': 'This email is already subscribed.'}), 400
        else:
            existing.active = True
            db.session.commit()
            return jsonify({'success': True, 'message': 'Welcome back! You\'re subscribed again.'})
    
    subscriber = NewsletterSubscriber(email=email)
    db.session.add(subscriber)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Thank you for subscribing!'})

@app.route("/search")
def search():
    query = request.args.get('q', '')
    if not query:
        return redirect(url_for('home'))
    
    # Search blog posts
    blog_results = BlogPost.query.filter(
        BlogPost.published == True,
        db.or_(
            BlogPost.title.contains(query),
            BlogPost.content.contains(query),
            BlogPost.excerpt.contains(query)
        )
    ).limit(10).all()
    
    # Search projects
    project_results = Project.query.filter(
        db.or_(
            Project.title.contains(query),
            Project.description.contains(query),
            Project.content.contains(query)
        )
    ).limit(10).all()
    
    return render_template("templates/search.html", query=query, blog_results=blog_results, project_results=project_results)

@app.route("/sitemap.xml")
def sitemap():
    """Generate sitemap.xml"""
    from flask import make_response
    
    urls = []
    
    # Static pages
    urls.append({'loc': request.url_root.rstrip('/'), 'changefreq': 'weekly', 'priority': '1.0'})
    urls.append({'loc': f"{request.url_root.rstrip('/')}/work", 'changefreq': 'monthly', 'priority': '0.8'})
    urls.append({'loc': f"{request.url_root.rstrip('/')}/blog", 'changefreq': 'weekly', 'priority': '0.8'})
    
    # Blog posts
    posts = BlogPost.query.filter_by(published=True).all()
    for post in posts:
        urls.append({
            'loc': f"{request.url_root.rstrip('/')}/blog/{post.slug}",
            'lastmod': post.updated_at.strftime('%Y-%m-%d'),
            'changefreq': 'monthly',
            'priority': '0.7'
        })
    
    # Projects
    projects = Project.query.all()
    for project in projects:
        urls.append({
            'loc': f"{request.url_root.rstrip('/')}/work/{project.slug}",
            'lastmod': project.created_at.strftime('%Y-%m-%d'),
            'changefreq': 'monthly',
            'priority': '0.7'
        })
    
    sitemap_xml = render_template('templates/sitemap.xml', urls=urls)
    response = make_response(sitemap_xml)
    response.headers['Content-Type'] = 'application/xml'
    return response

@app.route("/robots.txt")
def robots():
    """Generate robots.txt"""
    from flask import make_response
    robots_txt = render_template('templates/robots.txt', url_root=request.url_root.rstrip('/'))
    response = make_response(robots_txt)
    response.headers['Content-Type'] = 'text/plain'
    return response

@app.route("/cv")
@app.route("/cv.pdf")
def download_cv():
    """Serve CV/Resume PDF"""
    cv_path = os.path.join('static', 'cv.pdf')
    if os.path.exists(cv_path):
        return send_file(
            cv_path, 
            as_attachment=True,
            download_name='DavidHE_CV.pdf',
            mimetype='application/pdf'
        )
    # Return 404 if file doesn't exist
    abort(404)

@app.errorhandler(404)
def not_found(error):
    return render_template('templates/404.html'), 404

# API Routes for frontend
@app.route("/api/testimonials")
def api_testimonials():
    testimonials = Testimonial.query.filter_by(featured=True).order_by(Testimonial.created_at.desc()).limit(6).all()
    return jsonify([{
        'id': t.id,
        'name': t.name,
        'role': t.role,
        'company': t.company,
        'content': t.content,
        'avatar_url': t.avatar_url,
        'rating': t.rating
    } for t in testimonials])

@app.route("/api/stats")
def api_stats():
    """Get portfolio statistics"""
    stats = {
        'blog_posts': BlogPost.query.filter_by(published=True).count(),
        'projects': Project.query.count(),
        'testimonials': Testimonial.query.filter_by(featured=True).count(),
        'subscribers': NewsletterSubscriber.query.filter_by(active=True).count()
    }
    return jsonify(stats)

# Helper functions
def send_contact_email(message):
    """Send email notification for new contact message"""
    if not app.config['MAIL_USERNAME'] or not app.config['MAIL_PASSWORD']:
        return
    
    try:
        msg = MIMEMultipart()
        msg['From'] = app.config['MAIL_USERNAME']
        msg['To'] = app.config['CONTACT_EMAIL']
        msg['Subject'] = f"New Contact: {message.subject or 'No Subject'}"
        
        body = f"""
        New contact message from portfolio website:
        
        Name: {message.name}
        Email: {message.email}
        Subject: {message.subject or 'No Subject'}
        
        Message:
        {message.message}
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(app.config['MAIL_SERVER'], app.config['MAIL_PORT'])
        server.starttls()
        server.login(app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD'])
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Email error: {e}")

if __name__ == "__main__":
    app.run(debug=True)
