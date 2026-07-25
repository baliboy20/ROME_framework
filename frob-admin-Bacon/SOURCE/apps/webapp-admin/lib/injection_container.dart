import 'package:get_it/get_it.dart';
import 'package:http/http.dart' as http;

import 'core/network/api_result.dart';
import 'core/session/session_store.dart';

import 'features/payments/data/datasources/payment_remote_data_source.dart';
import 'features/payments/data/repositories/payment_repository_impl.dart';
import 'features/payments/domain/repositories/payment_repository.dart';
import 'features/payments/domain/usecases/get_payments.dart';
import 'features/payments/domain/usecases/refund_booking.dart';
import 'features/payments/presentation/bloc/payments_bloc.dart';

import 'features/bookings/data/datasources/booking_remote_data_source.dart';
import 'features/bookings/data/repositories/booking_repository_impl.dart';
import 'features/bookings/domain/repositories/booking_repository.dart';
import 'features/bookings/domain/usecases/get_booking_detail.dart';

import 'features/enquiries/data/datasources/enquiry_remote_data_source.dart';
import 'features/enquiries/data/repositories/enquiry_repository_impl.dart';
import 'features/enquiries/domain/repositories/enquiry_repository.dart';
import 'features/enquiries/domain/usecases/get_enquiries.dart';
import 'features/enquiries/domain/usecases/reply_enquiry.dart';
import 'features/enquiries/presentation/bloc/enquiries_bloc.dart';

import 'features/safety/data/datasources/safety_remote_data_source.dart';
import 'features/safety/data/repositories/safety_repository_impl.dart';
import 'features/safety/domain/repositories/safety_repository.dart';
import 'features/safety/domain/usecases/safety_usecases.dart';
import 'features/safety/presentation/bloc/incidents_bloc.dart';
import 'features/safety/presentation/bloc/hazards_bloc.dart';

/// Service locator. `main()` calls [configureDependencies] once at startup.
/// Registration order: external → core → per-feature (data → domain → bloc).
/// Each feature adds one `_register<Feature>()` block as it is migrated.
final GetIt sl = GetIt.instance;

void configureDependencies() {
  // ---- external -----------------------------------------------------------
  sl.registerLazySingleton<http.Client>(() => http.Client());

  // ---- core ---------------------------------------------------------------
  sl.registerLazySingleton<SessionStore>(() => SessionStore());
  sl.registerLazySingleton<ApiHttp>(() => ApiHttp(
        httpClient: sl(),
        baseUrl: kApiBaseUrl,
        tokenProvider: () => sl<SessionStore>().token,
      ));

  // ---- features -----------------------------------------------------------
  _registerBookings();
  _registerPayments();
  _registerEnquiries();
  _registerSafety();
}

void _registerSafety() {
  sl.registerLazySingleton<SafetyRemoteDataSource>(
      () => SafetyRemoteDataSourceImpl(sl()));
  sl.registerLazySingleton<SafetyRepository>(() => SafetyRepositoryImpl(sl()));
  sl.registerLazySingleton(() => GetIncidents(sl()));
  sl.registerLazySingleton(() => DispatchIncident(sl()));
  sl.registerLazySingleton(() => GetHazards(sl()));
  sl.registerLazySingleton(() => ReviewHazard(sl()));
  sl.registerFactory(() => IncidentsBloc(getIncidents: sl(), dispatchIncident: sl()));
  sl.registerFactory(() => HazardsBloc(getHazards: sl(), reviewHazard: sl()));
}

void _registerEnquiries() {
  sl.registerLazySingleton<EnquiryRemoteDataSource>(
      () => EnquiryRemoteDataSourceImpl(sl()));
  sl.registerLazySingleton<EnquiryRepository>(() => EnquiryRepositoryImpl(sl()));
  sl.registerLazySingleton(() => GetEnquiries(sl()));
  sl.registerLazySingleton(() => ReplyEnquiry(sl()));
  sl.registerFactory(() => EnquiriesBloc(getEnquiries: sl(), replyEnquiry: sl()));
}

void _registerBookings() {
  sl.registerLazySingleton<BookingRemoteDataSource>(
      () => BookingRemoteDataSourceImpl(sl()));
  sl.registerLazySingleton<BookingRepository>(
      () => BookingRepositoryImpl(sl()));
  sl.registerLazySingleton(() => GetBookingDetail(sl()));
}

void _registerPayments() {
  // data
  sl.registerLazySingleton<PaymentRemoteDataSource>(
      () => PaymentRemoteDataSourceImpl(sl()));
  sl.registerLazySingleton<PaymentRepository>(
      () => PaymentRepositoryImpl(sl()));
  // domain
  sl.registerLazySingleton(() => GetPayments(sl()));
  sl.registerLazySingleton(() => RefundBooking(sl()));
  // presentation — factory: a fresh Bloc per screen mount
  sl.registerFactory(() => PaymentsBloc(getPayments: sl(), refundBooking: sl()));
}

/// Base URL for the api-worker, overridable via --dart-define=API_BASE_URL=...
const String kApiBaseUrl =
    String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:8787');
