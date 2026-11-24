# Topic list

Generated from content/syllabus.json. Priority 1 = asked in almost every interview. Mark: **Projekt** = shown in CV/Gmail · **— kein Projekt** = no project experience · **? prüfen** = unclear, you decide.

404 topics · P1 239 · P2 125 · P3 40 · written 83

## Java 21 (core + advanced) (40)
Sources: Java SE 21/25 docs (docs.oracle.com) · JVM Specification · OpenJDK source + JEPs (openjdk.org) · Oracle Java SE 21 Developer exam 1Z0-830 topics

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | JVM-Architektur | Projekt | ✓ |
| 1 | JIT-Compiler | Projekt | ✓ |
| 1 | Speicherbereiche der JVM | Projekt | ✓ |
| 1 | Garbage Collection: Grundlagen | Projekt | ✓ |
| 1 | GC-Collectors | ? prüfen | ✓ |
| 1 | Memory Leaks und OutOfMemoryError | ? prüfen | ✓ |
| 1 | Java Memory Model | ? prüfen | ✓ |
| 1 | Threads | Projekt | ✓ |
| 1 | Synchronisation und Locks | Projekt | ✓ |
| 1 | ExecutorService, Thread Pools, ForkJoinPool, Konfiguration | Projekt |  |
| 1 | Virtual Threads (Java 21), Pinning, Structured Concurrency | — kein Projekt |  |
| 1 | HashMap | Projekt | ✓ |
| 1 | ConcurrentHashMap | Projekt | ✓ |
| 1 | ArrayList vs LinkedList vs CopyOnWriteArrayList | Projekt |  |
| 1 | equals() und hashCode(): Vertrag, Fehler, Records | Projekt |  |
| 1 | String: Immutability, String Pool, intern, StringBuilder, Compact Strings | Projekt |  |
| 1 | Generics: Type Erasure, Wildcards, PECS, Bounded Types | Projekt |  |
| 1 | Exceptions: checked vs unchecked, try-with-resources, Best Practices | Projekt |  |
| 1 | Stream API: lazy, intermediate vs terminal, Collectors, parallel Streams | Projekt |  |
| 1 | Lambdas, Functional Interfaces, Method References | Projekt |  |
| 1 | Records, Sealed Classes, Pattern Matching, Switch Expressions | Projekt |  |
| 1 | Interface vs abstrakte Klasse, default und static Methods | Projekt |  |
| 1 | OOP: Kapselung, Vererbung, Polymorphismus, Overloading vs Overriding | Projekt |  |
| 1 | Java 8 bis 21 (und 25): wichtigste Neuerungen | Projekt |  |
| 1 | Thread Dumps lesen und analysieren | ? prüfen |  |
| 1 | Profiling: JFR, async-profiler, Heap-Analyse | ? prüfen |  |
| 2 | Class Loading | Projekt | ✓ |
| 2 | Atomic-Klassen und Compare-and-Swap (CAS) | ? prüfen |  |
| 2 | CompletableFuture und asynchrone Programmierung | ? prüfen |  |
| 2 | TreeMap, LinkedHashMap, EnumMap, WeakHashMap, IdentityHashMap | Projekt |  |
| 2 | HashSet, TreeSet, LinkedHashSet, Queue, Deque, PriorityQueue | Projekt |  |
| 2 | Comparable vs Comparator | Projekt |  |
| 2 | Unveränderliche Objekte: Regeln, Vorteile, defensive Kopien | Projekt |  |
| 2 | Optional: richtige und falsche Nutzung | Projekt |  |
| 2 | static, final, finally, finalize | Projekt |  |
| 2 | Primitive vs Wrapper, Autoboxing, Integer-Cache | Projekt |  |
| 2 | Reflection und Annotations: Funktion, Kosten, Nutzung in Frameworks | ? prüfen |  |
| 3 | Serialisierung: Serializable, Risiken, Alternativen (JSON) | ? prüfen |  |
| 3 | IO vs NIO: Streams, Buffers, Channels, Files API | ? prüfen |  |
| 3 | Java-Module (JPMS) | — kein Projekt |  |

## Spring Boot + Spring family (23)
Sources: Spring Framework reference · Spring Boot 3 reference · Spring Security reference · Spring Certified Professional exam guide

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | IoC und Dependency Injection: Constructor vs Field Injection | Projekt |  |
| 1 | Bean-Lebenszyklus, PostConstruct, BeanPostProcessor | Projekt |  |
| 1 | Bean Scopes: singleton, prototype, request, session | Projekt |  |
| 1 | AOP und Proxies: JDK Proxy vs CGLIB, Self-Invocation | ? prüfen |  |
| 1 | @Transactional: wie es intern funktioniert, Fallen | Projekt |  |
| 1 | Propagation und Isolation in Spring | Projekt |  |
| 1 | Spring Boot Auto-Configuration und Starters | Projekt |  |
| 1 | Konfiguration: Properties, @ConfigurationProperties, Profiles | Projekt |  |
| 1 | Spring MVC: DispatcherServlet, Request-Ablauf, Filter vs Interceptor | Projekt |  |
| 1 | Fehlerbehandlung: @ControllerAdvice, ProblemDetail | Projekt |  |
| 1 | Spring Data JPA: Repositories, Queries, Pagination, Projections | Projekt |  |
| 1 | Spring Security: Filter Chain, Authentication, Authorization | Projekt |  |
| 1 | Spring Security mit OAuth2 Resource Server und JWT | Projekt |  |
| 1 | Spring Testing: @SpringBootTest, Slices, MockitoBean, Testcontainers | Projekt |  |
| 1 | Spring Boot 3: Jakarta, Java 17+, Native Images, Observability | Projekt |  |
| 2 | Bean Validation: @Valid, eigene Validatoren | Projekt |  |
| 2 | Method Security: @PreAuthorize | ? prüfen |  |
| 2 | Actuator, Health Checks, Micrometer, Observability | Projekt |  |
| 2 | Spring WebFlux und reaktive Programmierung | — kein Projekt |  |
| 2 | Spring Cloud: Config, Gateway, Resilience4j | — kein Projekt |  |
| 2 | @Scheduled, @Async, Events | ? prüfen |  |
| 2 | Spring Cache: @Cacheable, Cache-Provider | ? prüfen |  |
| 3 | Spring Batch: Job, Step, Chunk | — kein Projekt |  |

## REST, JSON, OpenAPI (11)
Sources: RFC 9110 HTTP Semantics · RFC 9457 Problem Details · OpenAPI 3.1 specification

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | HTTP-Methoden, sicher und idempotent | Projekt |  |
| 1 | HTTP-Statuscodes richtig wählen | Projekt |  |
| 1 | Ressourcen-Design, URLs, Richardson Maturity Model | Projekt |  |
| 1 | Pagination, Filter, Sortierung | Projekt |  |
| 1 | API-Versionierung | ? prüfen |  |
| 1 | OpenAPI, Contract-First, Code-Generierung | Projekt |  |
| 1 | API-Sicherheit: Auth, CORS, CSRF, Rate Limiting | Projekt |  |
| 2 | JSON mit Jackson: Serialisierung, Annotations, Fallen | Projekt |  |
| 2 | HTTP-Caching: Cache-Control, ETag | ? prüfen |  |
| 2 | Fehlerformat: Problem Details (RFC 9457) | Projekt |  |
| 2 | REST vs GraphQL vs gRPC | Projekt |  |

## Microservices + event-driven (17)
Sources: microservices.io patterns (Chris Richardson) · Azure Architecture Center: cloud design patterns · Building Microservices (Sam Newman)

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Monolith vs Modulith vs Microservices | Projekt | ✓ |
| 1 | Service-Schnitt mit DDD und Bounded Contexts | ? prüfen | ✓ |
| 1 | Synchrone vs asynchrone Kommunikation | Projekt | ✓ |
| 1 | API Gateway und BFF | ? prüfen | ✓ |
| 1 | Database per Service und Datenkonsistenz | ? prüfen | ✓ |
| 1 | Saga: Choreografie vs Orchestrierung | ? prüfen | ✓ |
| 1 | Outbox Pattern und CDC | ? prüfen | ✓ |
| 1 | Idempotenz in verteilten Systemen | Projekt | ✓ |
| 1 | Resilience: Timeout, Retry, Circuit Breaker, Bulkhead | ? prüfen | ✓ |
| 1 | Distributed Tracing und Korrelation | Projekt | ✓ |
| 1 | Event-Driven Architecture: Events, Commands, Event-Design | Projekt | ✓ |
| 1 | Deployment: Rolling, Blue-Green, Canary, Feature Flags | Projekt | ✓ |
| 2 | Service Discovery und Load Balancing | ? prüfen |  |
| 2 | CQRS und Event Sourcing | — kein Projekt |  |
| 2 | Migration vom Monolithen: Strangler Fig | ? prüfen |  |
| 2 | Testen von Microservices: Contract Tests | ? prüfen |  |
| 2 | 12-Factor App | ? prüfen |  |

## Apache Kafka (15)
Sources: Apache Kafka documentation · Confluent developer docs · Confluent CCDAK exam topics

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Kafka-Architektur: Broker, Topic, Partition, KRaft | Projekt | ✓ |
| 1 | Producer intern: Batching, acks, Idempotenz, Partitioner | ? prüfen | ✓ |
| 1 | Consumer Groups und Rebalancing | Projekt | ✓ |
| 1 | Offsets und Commit-Strategien | Projekt | ✓ |
| 1 | At-most-once, At-least-once, Exactly-once | Projekt |  |
| 1 | Reihenfolge und Keys | Projekt | ✓ |
| 1 | Replikation, ISR, min.insync.replicas | ? prüfen | ✓ |
| 1 | Fehler, Retries, Dead Letter Topic | ? prüfen | ✓ |
| 1 | Kafka vs RabbitMQ vs Event Hub vs Solace | Projekt |  |
| 2 | Retention und Log Compaction | ? prüfen |  |
| 2 | Kafka-Transaktionen | — kein Projekt |  |
| 2 | Schema Registry, Avro, Kompatibilität | ? prüfen |  |
| 2 | Kafka Streams und Kafka Connect | — kein Projekt |  |
| 2 | Performance und Tuning | ? prüfen |  |
| 2 | Monitoring und Consumer Lag | ? prüfen |  |

## SOAP, WSDL, XSD (8)
Sources: Jakarta XML Web Services / JAXB specs · W3C SOAP 1.2 and WSDL · Spring Web Services reference

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | SOAP vs REST | Projekt |  |
| 2 | SOAP: Envelope, Header, Body, Fault | Projekt |  |
| 2 | WSDL | Projekt |  |
| 2 | XSD: Typen und Validierung | Projekt |  |
| 2 | JAXB: Marshalling und Unmarshalling | Projekt |  |
| 2 | JAX-WS und Spring-WS | ? prüfen |  |
| 2 | Contract-First vs Code-First | ? prüfen |  |
| 3 | WS-Security | ? prüfen |  |

## Kotlin (4)
Sources: kotlinlang.org docs

| P | Topic | Project | Written |
|---|---|---|---|
| 3 | Kotlin-Grundlagen und Null Safety | Projekt |  |
| 3 | Data Classes und Extension Functions | Projekt |  |
| 3 | Coroutines | — kein Projekt |  |
| 3 | Interop mit Java | Projekt |  |

## Go (Golang) (2)
Sources: go.dev documentation, Effective Go

| P | Topic | Project | Written |
|---|---|---|---|
| 3 | Goroutines und Channels | Projekt |  |
| 3 | Interfaces und Error Handling in Go | Projekt |  |

## gRPC + Protobuf (3)
Sources: grpc.io docs · protobuf.dev

| P | Topic | Project | Written |
|---|---|---|---|
| 3 | Protobuf und Schema-Evolution | Projekt |  |
| 3 | gRPC: Unary und Streaming, Deadlines | Projekt |  |
| 3 | gRPC vs REST | Projekt |  |

## Apache Camel (1)
Sources: Apache Camel docs · Enterprise Integration Patterns (Hohpe/Woolf)

| P | Topic | Project | Written |
|---|---|---|---|
| 3 | Enterprise Integration Patterns und Camel Routes | — kein Projekt |  |

## C# / .NET / Blazor / EF Core (5)
Sources: Microsoft Learn: .NET, C#, EF Core, Blazor

| P | Topic | Project | Written |
|---|---|---|---|
| 3 | .NET und C# für Java-Entwickler | Projekt |  |
| 3 | async/await in .NET | ? prüfen |  |
| 3 | BackgroundService und Worker | Projekt |  |
| 3 | Entity Framework Core | ? prüfen |  |
| 3 | Blazor | Projekt |  |

## JSF / PrimeFaces (7)
Sources: Jakarta Faces 4 specification · PrimeFaces documentation

| P | Topic | Project | Written |
|---|---|---|---|
| 2 | JSF-Lebenszyklus: die 6 Phasen | Projekt |  |
| 2 | Managed Beans, CDI, Scopes | Projekt |  |
| 2 | Ajax und Partial Rendering | Projekt |  |
| 2 | PrimeFaces-Komponenten und Lazy DataTable | Projekt |  |
| 2 | Migration RichFaces zu PrimeFaces / Jakarta Faces | Projekt |  |
| 3 | ViewState: client vs server | ? prüfen |  |
| 3 | Converter und Validatoren | Projekt |  |

## Python (8)
Sources: docs.python.org · pandas and pytest docs

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Iteratoren und Generatoren | ? prüfen |  |
| 2 | Listen, Dicts, Sets, Tuples: intern und Komplexität | Projekt |  |
| 2 | Decorators und Context Manager | ? prüfen |  |
| 2 | GIL, Threads, Multiprocessing, asyncio | ? prüfen |  |
| 2 | pandas-Grundlagen | ? prüfen |  |
| 2 | pytest | Projekt |  |
| 3 | Type Hints | ? prüfen |  |
| 3 | venv, pip, Packaging | ? prüfen |  |

## PostgreSQL + SQL (20)
Sources: PostgreSQL 16/17 documentation · Use The Index, Luke (Markus Winand)

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | ACID und Transaktionen | Projekt | ✓ |
| 1 | MVCC: wie PostgreSQL Versionen speichert | ? prüfen | ✓ |
| 1 | VACUUM, Autovacuum, Bloat | ? prüfen | ✓ |
| 1 | Isolation Levels und Anomalien | ? prüfen | ✓ |
| 1 | Locks, Row Locks, Deadlocks, SELECT FOR UPDATE, SKIP LOCKED | ? prüfen |  |
| 1 | Index-Typen in PostgreSQL | ? prüfen | ✓ |
| 1 | Query Planner und EXPLAIN | ? prüfen | ✓ |
| 1 | Join-Algorithmen | ? prüfen | ✓ |
| 1 | Window Functions | ? prüfen |  |
| 1 | Normalisierung und Denormalisierung | Projekt | ✓ |
| 1 | Connection Pooling: HikariCP, PgBouncer | ? prüfen | ✓ |
| 1 | Performance-Tuning: Konfiguration und Abfragen | ? prüfen | ✓ |
| 1 | Mandantenfähigkeit: DB, Schema oder Zeile | Projekt | ✓ |
| 2 | CTEs und rekursive Abfragen | ? prüfen |  |
| 2 | Constraints, Keys, Sequences vs UUID | Projekt |  |
| 2 | JSONB und Indizes darauf | ? prüfen |  |
| 2 | Tabellen-Partitionierung | — kein Projekt |  |
| 2 | Replikation und Hochverfügbarkeit | — kein Projekt |  |
| 2 | Backup und Point-in-Time Recovery | — kein Projekt |  |
| 2 | Volltextsuche in PostgreSQL | — kein Projekt |  |

## Oracle + PL/SQL (2)
Sources: Oracle Database SQL and PL/SQL docs

| P | Topic | Project | Written |
|---|---|---|---|
| 3 | Oracle vs PostgreSQL | — kein Projekt |  |
| 3 | PL/SQL: Prozeduren, Packages, Cursors | — kein Projekt |  |

## Hibernate / JPA + Flyway (8)
Sources: Hibernate ORM 6 user guide · Jakarta Persistence 3 spec · Vlad Mihalcea articles · Flyway docs

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Entity-Zustände: transient, managed, detached, removed | Projekt |  |
| 1 | Persistence Context, First-Level Cache, Flush, Dirty Checking | ? prüfen |  |
| 1 | Lazy vs Eager Loading, LazyInitializationException | Projekt |  |
| 1 | N+1-Problem: erkennen und lösen | ? prüfen |  |
| 1 | Optimistic vs Pessimistic Locking | ? prüfen |  |
| 1 | Flyway und Liquibase | Projekt |  |
| 2 | Second-Level Cache | — kein Projekt |  |
| 2 | Beziehungen, Cascade, Inheritance Mapping | Projekt |  |

## SQL Server (1)
Sources: Microsoft Learn: SQL Server T-SQL

| P | Topic | Project | Written |
|---|---|---|---|
| 3 | SQL Server für PostgreSQL-Entwickler, OUTPUT-Klausel | Projekt |  |

## Apache Spark / PySpark (16)
Sources: Apache Spark 3.5/4 documentation · Databricks Spark developer exam topics

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Spark-Architektur: Driver, Executor, Cluster Manager | Projekt |  |
| 1 | RDD vs DataFrame vs Dataset | Projekt |  |
| 1 | Lazy Evaluation, DAG, Jobs, Stages, Tasks | Projekt |  |
| 1 | Narrow vs Wide Transformations | Projekt |  |
| 1 | Shuffle: was es ist und warum es teuer ist | Projekt |  |
| 1 | Partitionen: repartition vs coalesce | Projekt |  |
| 1 | Joins: Broadcast, Sort-Merge, Shuffle Hash | Projekt |  |
| 1 | Data Skew und Salting | ? prüfen |  |
| 1 | Adaptive Query Execution | ? prüfen |  |
| 1 | Spark-Speicher und OutOfMemory | ? prüfen |  |
| 2 | Catalyst Optimizer und Tungsten | ? prüfen |  |
| 2 | cache und persist | ? prüfen |  |
| 2 | UDFs vs eingebaute Funktionen, Pandas UDFs | ? prüfen |  |
| 2 | Structured Streaming | — kein Projekt |  |
| 2 | Spark auf Kubernetes | Projekt |  |
| 2 | Spark-Tuning: wichtigste Konfigurationen | ? prüfen |  |

## Apache Iceberg (11)
Sources: Apache Iceberg spec and docs (iceberg.apache.org)

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Was ist ein Table Format? Iceberg-Grundlagen | Projekt |  |
| 1 | Metadaten: metadata.json, Manifest List, Manifests | ? prüfen |  |
| 1 | Snapshots und Time Travel | ? prüfen |  |
| 1 | Hidden Partitioning und Partition Evolution | Projekt |  |
| 1 | Schema Evolution | ? prüfen |  |
| 1 | Merge-on-Read vs Copy-on-Write, Delete Files | Projekt |  |
| 1 | Wartung: Compaction, expire_snapshots, Orphan Files | Projekt |  |
| 1 | Kataloge: Nessie, REST, Hive, Glue | Projekt |  |
| 1 | Iceberg vs Delta Lake vs Hudi | Projekt |  |
| 2 | Gleichzeitige Writes und optimistisches Commit | ? prüfen |  |
| 2 | Branches und Tags | ? prüfen |  |

## Lakehouse + medallion + ETL (11)
Sources: Designing Data-Intensive Applications (Kleppmann) · Fundamentals of Data Engineering (Reis/Housley)

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Data Lake vs Warehouse vs Lakehouse | Projekt |  |
| 1 | Medallion-Architektur | Projekt |  |
| 1 | ETL vs ELT | Projekt |  |
| 1 | Batch vs Streaming, Lambda und Kappa | Projekt |  |
| 1 | Idempotente und crash-sichere Pipelines | Projekt |  |
| 1 | Late Data, Watermarks, Backfills | ? prüfen |  |
| 1 | Datenqualität und Data Contracts | ? prüfen |  |
| 1 | Dateiformate: Parquet, Avro, ORC, CSV | Projekt |  |
| 1 | Small-Files-Problem | Projekt |  |
| 2 | Change Data Capture | — kein Projekt |  |
| 2 | Governance, Lineage, Datenschutz | ? prüfen |  |

## Dremio, Nessie, MinIO, Parquet (5)
Sources: Dremio docs · Apache Arrow docs · Project Nessie docs · MinIO docs · Apache Parquet format spec

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Project Nessie: Git für Daten | Projekt |  |
| 1 | Parquet intern: Row Groups, Column Chunks, Encoding, Predicate Pushdown | Projekt |  |
| 2 | Dremio: Architektur und Reflections | Projekt |  |
| 2 | Apache Arrow und Arrow Flight SQL | Projekt |  |
| 2 | MinIO und S3-API | Projekt |  |

## Data modelling (star, SCD2, Data Vault) (6)
Sources: Kimball Group dimensional modeling techniques · Data Vault 2.0 (Linstedt)

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | OLTP vs OLAP | ? prüfen |  |
| 1 | Star Schema vs Snowflake Schema | — kein Projekt |  |
| 1 | Fakten und Dimensionen, Grain | — kein Projekt |  |
| 1 | Slowly Changing Dimensions (Typ 1, 2, 3) | — kein Projekt |  |
| 2 | Data Vault 2.0: Hub, Link, Satellite | — kein Projekt |  |
| 2 | Kimball vs Inmon vs One Big Table | — kein Projekt |  |

## Airflow / orchestration (4)
Sources: Apache Airflow 2/3 documentation

| P | Topic | Project | Written |
|---|---|---|---|
| 2 | DAGs, Operators, Tasks | — kein Projekt |  |
| 2 | Scheduler und Executors | — kein Projekt |  |
| 2 | Backfill und idempotente DAGs | — kein Projekt |  |
| 3 | XCom und Sensors | — kein Projekt |  |

## dbt (3)
Sources: docs.getdbt.com

| P | Topic | Project | Written |
|---|---|---|---|
| 2 | dbt-Models und Materializations | — kein Projekt |  |
| 2 | Tests, Sources, Lineage | — kein Projekt |  |
| 3 | Incremental Models und Snapshots | — kein Projekt |  |

## Databricks (3)
Sources: Databricks and Delta Lake docs

| P | Topic | Project | Written |
|---|---|---|---|
| 2 | Delta Lake | — kein Projekt |  |
| 2 | Databricks vs eigener Stack (Spark, Iceberg, Nessie) | — kein Projekt |  |
| 3 | Unity Catalog und Workspaces | — kein Projekt |  |

## Azure (14)
Sources: Microsoft Learn: AZ-204 and AZ-305 skills outlines · Azure Architecture Center

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Grundlagen: Tenant, Subscription, Resource Group, Regionen (Schweiz) | ? prüfen |  |
| 1 | Compute: Functions vs Container Apps vs App Service vs AKS | Projekt |  |
| 1 | Azure Functions: Trigger, Bindings, Pläne, Durable Functions | Projekt |  |
| 1 | Event Grid vs Event Hub vs Service Bus | Projekt |  |
| 1 | Blob Storage: Tiers, SAS, Lifecycle, ADLS Gen2 | Projekt |  |
| 1 | VNet, Subnetze, NSG, Private Endpoints, Private DNS | Projekt |  |
| 1 | Entra ID, Managed Identity, Workload Identity, RBAC | Projekt |  |
| 1 | Key Vault: Secrets, Keys, Zertifikate | Projekt |  |
| 1 | Azure Monitor, Log Analytics, Application Insights | Projekt |  |
| 1 | AKS: Node Pools, Netzwerk, Identity, ACR | Projekt |  |
| 1 | Azure DevOps: Pipelines, Repos, Environments | Projekt |  |
| 2 | Defender for Cloud und Malware Scanning | Projekt |  |
| 2 | Daten-Services: ADF, Synapse, Fabric, Databricks | — kein Projekt |  |
| 2 | Kosten und Governance: Tags, Policies, Budgets | ? prüfen |  |

## AWS (2)
Sources: AWS documentation · AWS Certified Developer Associate exam guide

| P | Topic | Project | Written |
|---|---|---|---|
| 3 | AWS-Grundlagen: EC2, S3, IAM, VPC, Lambda, RDS, EKS | ? prüfen |  |
| 3 | AWS vs Azure: Dienste übersetzen | Projekt |  |

## Kubernetes + Docker (18)
Sources: kubernetes.io documentation · CKA and CKAD curricula (CNCF)

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Kubernetes-Architektur | Projekt | ✓ |
| 1 | Pods und Sidecars | Projekt | ✓ |
| 1 | Deployments und Rollouts | Projekt | ✓ |
| 1 | Services und DNS | Projekt | ✓ |
| 1 | Ingress und Gateway API | ? prüfen |  |
| 1 | ConfigMaps und Secrets | Projekt | ✓ |
| 1 | PV, PVC, StorageClass, StatefulSet | ? prüfen | ✓ |
| 1 | Liveness, Readiness, Startup Probes | Projekt | ✓ |
| 1 | Requests, Limits, QoS-Klassen, OOMKilled | Projekt | ✓ |
| 1 | HPA, VPA, Cluster Autoscaler, Karpenter | Projekt |  |
| 1 | RBAC und ServiceAccounts | ? prüfen | ✓ |
| 1 | Network Policies und CNI (Cilium) | Projekt | ✓ |
| 1 | Troubleshooting: CrashLoopBackOff, Pending, ImagePullBackOff | Projekt | ✓ |
| 1 | Docker: Image, Layer, Multi-Stage, Container vs VM | Projekt | ✓ |
| 2 | DaemonSet, Job, CronJob | Projekt |  |
| 2 | Scheduling: Affinity, Taints, Tolerations | ? prüfen |  |
| 2 | Pod Security, Admission Controller (Kyverno) | Projekt |  |
| 2 | Operators und CRDs | ? prüfen |  |

## OpenShift (1)
Sources: Red Hat OpenShift documentation

| P | Topic | Project | Written |
|---|---|---|---|
| 3 | OpenShift vs Kubernetes: Routes, SCC, Operators | — kein Projekt |  |

## Terraform, Helm, ArgoCD (5)
Sources: Terraform docs · Helm docs · Argo CD docs · OpenGitOps principles

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Terraform: State, Plan, Apply, Module, Drift | Projekt |  |
| 1 | Helm: Templates, Values, Releases | Projekt |  |
| 1 | Argo CD: Sync, Prune, Self-Heal, Hooks, App of Apps | Projekt |  |
| 1 | GitOps-Prinzipien | Projekt |  |
| 2 | Kustomize vs Helm | — kein Projekt |  |

## CI/CD (Azure DevOps, Jenkins, GitHub Actions, Sonar) (6)
Sources: Azure Pipelines, Jenkins, GitHub Actions docs · SonarQube docs

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | CI/CD-Pipeline: Stufen und Qualitäts-Gates | Projekt |  |
| 1 | Branching-Strategien: Trunk-Based, GitFlow | ? prüfen |  |
| 2 | Versionierung und Artefakte | ? prüfen |  |
| 2 | SonarQube und Code-Qualität | Projekt |  |
| 2 | Secrets in Pipelines | Projekt |  |
| 2 | Azure DevOps vs Jenkins vs GitHub Actions vs GitLab | Projekt |  |

## Monitoring (Prometheus, Grafana, logs) (4)
Sources: Prometheus docs · OpenTelemetry docs · Google SRE book (SLOs)

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Logs, Metriken, Traces | Projekt |  |
| 2 | Prometheus: Pull-Modell, Metrik-Typen, PromQL | Projekt |  |
| 2 | OpenTelemetry | Projekt |  |
| 2 | Alerting, SLI, SLO, SLA | ? prüfen |  |

## Security (OAuth2, JWT, Keycloak, Vault, OWASP) (10)
Sources: OWASP Top 10 (2025) · RFC 6749/9700 OAuth 2 · OpenID Connect Core · RFC 7519 JWT · Keycloak and Vault docs

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Authentifizierung vs Autorisierung | Projekt |  |
| 1 | OAuth 2 Flows: Authorization Code + PKCE, Client Credentials | ? prüfen |  |
| 1 | OpenID Connect | ? prüfen |  |
| 1 | JWT: Aufbau, Signatur, Validierung, Risiken | Projekt |  |
| 1 | OWASP Top 10 | ? prüfen |  |
| 1 | Secret-Management mit Vault | Projekt |  |
| 1 | XSS, CSRF, CORS, SQL Injection | ? prüfen |  |
| 2 | Keycloak | Projekt |  |
| 2 | TLS und mTLS | ? prüfen |  |
| 2 | Datenschutz: DSG und DSGVO für Entwickler | Projekt |  |

## Angular (14 → modern) (13)
Sources: angular.dev guides (v20) · RxJS docs

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Angular-Architektur: Standalone vs NgModule | Projekt | ✓ |
| 1 | Komponenten und Lifecycle Hooks | Projekt | ✓ |
| 1 | Change Detection: Zone.js, OnPush, Zoneless | ? prüfen | ✓ |
| 1 | Dependency Injection in Angular, inject() | Projekt | ✓ |
| 1 | RxJS: Observable, Subscription, Hot vs Cold | Projekt | ✓ |
| 1 | RxJS-Operatoren: switchMap, mergeMap, concatMap, exhaustMap | Projekt |  |
| 1 | Subject, BehaviorSubject, ReplaySubject | Projekt |  |
| 1 | Routing, Guards, Resolver, Lazy Loading | Projekt |  |
| 1 | Reactive Forms vs Template Forms | Projekt |  |
| 1 | HttpClient und Interceptors | Projekt |  |
| 1 | Angular 14 bis 20: was ist neu | ? prüfen |  |
| 2 | Performance: trackBy, @defer, Bundle-Grösse | ? prüfen |  |
| 2 | Angular-Tests | ? prüfen |  |

## Angular Signals + NgRx (9)
Sources: angular.dev signals guide · NgRx docs (Store, Effects, Entity, SignalStore)

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Signals: signal, computed, effect | — kein Projekt | ✓ |
| 1 | input(), output(), model(), viewChild() | — kein Projekt | ✓ |
| 1 | Signals und RxJS | — kein Projekt | ✓ |
| 1 | NgRx Store | — kein Projekt | ✓ |
| 1 | NgRx Effects | — kein Projekt | ✓ |
| 1 | NgRx SignalStore | — kein Projekt |  |
| 1 | Welches State Management wann? | — kein Projekt |  |
| 2 | linkedSignal und resource() | — kein Projekt |  |
| 2 | NgRx Entity | — kein Projekt |  |

## Testing (JUnit, Mockito, Playwright, Cypress) (8)
Sources: JUnit 5 user guide · Mockito docs · Testcontainers docs · Playwright docs

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Testpyramide und Teststrategie | Projekt |  |
| 1 | JUnit 5 und Mockito | Projekt |  |
| 1 | Testcontainers | Projekt |  |
| 2 | Mock, Stub, Spy, Fake | ? prüfen |  |
| 2 | E2E: Playwright, Cypress, Selenium | Projekt |  |
| 2 | TDD | ? prüfen |  |
| 2 | Contract Testing | — kein Projekt |  |
| 2 | Flaky Tests | Projekt |  |

## Design patterns + architecture styles (10)
Sources: Design Patterns (GoF) · Hexagonal Architecture (Alistair Cockburn) · Clean Architecture (Robert C. Martin) · Domain-Driven Design (Evans)

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | SOLID | ? prüfen |  |
| 1 | Erzeugungsmuster: Singleton, Factory, Builder | ? prüfen |  |
| 1 | Strukturmuster: Adapter, Decorator, Facade, Proxy | ? prüfen |  |
| 1 | Verhaltensmuster: Strategy, Observer, Template Method, Command | ? prüfen |  |
| 1 | Layered Architecture | ? prüfen |  |
| 1 | Hexagonale Architektur (Ports and Adapters) | ? prüfen |  |
| 1 | Onion und Clean Architecture | ? prüfen |  |
| 1 | DDD taktisch: Entity, Value Object, Aggregate, Repository | ? prüfen |  |
| 1 | Anti-Patterns und Code Smells | ? prüfen |  |
| 2 | DDD strategisch: Bounded Context, Context Map | ? prüfen |  |

## Search (Elasticsearch, OpenSearch, vector search) (6)
Sources: Elasticsearch / OpenSearch docs · Introduction to Information Retrieval (Manning et al.)

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Inverted Index | — kein Projekt | ✓ |
| 1 | Vektorsuche und Embeddings | — kein Projekt | ✓ |
| 1 | Suchindex synchron halten | — kein Projekt | ✓ |
| 2 | Analyzer, Tokenizer, Stemming | — kein Projekt |  |
| 2 | Relevanz: TF-IDF und BM25 | — kein Projekt |  |
| 2 | Elasticsearch: Shards, Replicas, Cluster | — kein Projekt |  |

## Camunda / CIB Seven (BPMN) (2)
Sources: Camunda 7 and 8 docs · BPMN 2.0 spec

| P | Topic | Project | Written |
|---|---|---|---|
| 3 | BPMN-Grundlagen | — kein Projekt |  |
| 3 | Process Engine, External Tasks, Camunda 7 vs 8 | — kein Projekt |  |

## Solace, Hazelcast, RabbitMQ (3)
Sources: RabbitMQ docs · Jakarta Messaging spec · Solace and Hazelcast docs

| P | Topic | Project | Written |
|---|---|---|---|
| 3 | RabbitMQ: Exchanges, Queues, Routing | — kein Projekt |  |
| 3 | JMS | — kein Projekt |  |
| 3 | Hazelcast und Solace | — kein Projekt |  |

## GIS (PostGIS, GeoTools, GeoServer) (2)
Sources: PostGIS docs · OGC WMS/WFS standards · GeoServer docs

| P | Topic | Project | Written |
|---|---|---|---|
| 3 | PostGIS: Geometrie-Typen, SRID, räumliche Indizes | Projekt |  |
| 3 | GIS-Dienste: WMS, WFS, GeoServer | — kein Projekt |  |

## Scrum / SAFe / agile (7)
Sources: The Scrum Guide 2020 · SAFe 6 framework

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Scrum-Rollen: Product Owner, Scrum Master, Developers | Projekt |  |
| 1 | Scrum Events | Projekt |  |
| 1 | Artefakte, Definition of Done, Definition of Ready | Projekt |  |
| 1 | Schätzung, Velocity, Burndown, Flow-Metriken | Projekt |  |
| 1 | SAFe: ART, PI Planning | Projekt |  |
| 1 | Code Reviews als Prozess | Projekt |  |
| 2 | Kanban vs Scrum | ? prüfen |  |

## AI-assisted development (1)
Sources: vendor docs (GitHub Copilot, Claude Code) · company AI usage policies

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | KI-gestützte Entwicklung: Nutzen, Risiken, Regeln | Projekt |  |

## System-Design-Grundlagen (12)
Sources: Designing Data-Intensive Applications (Kleppmann) · System Design Interview vol. 1+2 (Alex Xu)

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Back-of-the-Envelope-Schätzung | — kein Projekt | ✓ |
| 1 | Load Balancing | — kein Projekt | ✓ |
| 1 | Caching: Strategien, Redis, Invalidierung | — kein Projekt | ✓ |
| 1 | CDN und Object Storage | — kein Projekt | ✓ |
| 1 | SQL vs NoSQL | — kein Projekt | ✓ |
| 1 | Replikation und Sharding | — kein Projekt | ✓ |
| 1 | CAP, PACELC, Konsistenzmodelle | — kein Projekt | ✓ |
| 1 | Queues und asynchrone Verarbeitung | — kein Projekt | ✓ |
| 1 | Rate Limiting: Algorithmen | — kein Projekt | ✓ |
| 1 | Verfügbarkeit, Redundanz, Disaster Recovery | — kein Projekt | ✓ |
| 1 | API-Design im System Design | — kein Projekt | ✓ |
| 2 | Consistent Hashing | — kein Projekt |  |

## Algorithmen und Datenstrukturen (14)
Sources: NeetCode 150 / LeetCode pattern lists · Introduction to Algorithms (CLRS) for definitions

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Big-O: Zeit und Speicher | — kein Projekt |  |
| 1 | Arrays und Hashing | — kein Projekt |  |
| 1 | Two Pointers | — kein Projekt |  |
| 1 | Sliding Window | — kein Projekt |  |
| 1 | Stack und Queue | — kein Projekt |  |
| 1 | Binary Search | — kein Projekt |  |
| 1 | Bäume: Traversierung, BST | — kein Projekt |  |
| 1 | Graphen: BFS, DFS | — kein Projekt |  |
| 1 | Heap und Priority Queue | — kein Projekt |  |
| 2 | Linked Lists | — kein Projekt |  |
| 2 | Intervalle | — kein Projekt |  |
| 2 | Sortieralgorithmen | — kein Projekt |  |
| 2 | Dynamic Programming: Grundidee | — kein Projekt |  |
| 2 | Rekursion und Backtracking | — kein Projekt |  |

## Git (5)
Sources: Pro Git (git-scm.com/book) · git documentation

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Merge vs Rebase | Projekt |  |
| 1 | Merge-Konflikte lösen | Projekt |  |
| 1 | Cherry-Pick, Revert, Reset | Projekt |  |
| 1 | Fehler rückgängig machen: reflog, reset, revert | Projekt |  |
| 2 | Branching-Modelle in Git | ? prüfen |  |

## Maven / Gradle (3)
Sources: Apache Maven docs · Gradle docs

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Maven: Lifecycle, Phasen, Plugins | Projekt |  |
| 1 | Abhängigkeiten: Scopes, Konflikte, BOM | Projekt |  |
| 2 | Gradle-Grundlagen und Maven vs Gradle | Projekt |  |

## Linux / Bash (4)
Sources: Linux man pages · The Linux Command Line (Shotts)

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Prozesse und Signale: ps, top, kill | ? prüfen |  |
| 1 | Dateien und Rechte: chmod, chown, find, grep | ? prüfen |  |
| 1 | Netzwerk-Befehle: curl, ss, dig, nc | ? prüfen |  |
| 1 | Einen Server debuggen: Logs, Disk, Memory, CPU | ? prüfen |  |

## Netzwerk-Grundlagen (5)
Sources: RFC 9110/9113/9114 (HTTP) · RFC 8446 (TLS 1.3) · MDN web docs

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | TCP vs UDP | — kein Projekt | ✓ |
| 1 | DNS: Auflösung, Records, TTL | — kein Projekt | ✓ |
| 1 | HTTP/1.1 vs HTTP/2 vs HTTP/3 | — kein Projekt | ✓ |
| 1 | TLS-Handshake und Zertifikate | — kein Projekt | ✓ |
| 1 | Layer-4 vs Layer-7 Load Balancer und Proxies | — kein Projekt | ✓ |

## Redis / Caching (3)
Sources: redis.io documentation

| P | Topic | Project | Written |
|---|---|---|---|
| 1 | Cache-Muster: Cache-Aside, Write-Through, Invalidierung | — kein Projekt |  |
| 2 | Redis-Datentypen und Einsatz | — kein Projekt |  |
| 2 | Eviction, TTL und Persistenz | — kein Projekt |  |

## XML-Verarbeitung (2)
Sources: Java API for XML Processing (JAXP) docs · OWASP XXE prevention cheat sheet

| P | Topic | Project | Written |
|---|---|---|---|
| 2 | DOM vs SAX vs StAX | Projekt |  |
| 2 | XPath, XSLT und XML-Sicherheit (XXE) | Projekt |  |
